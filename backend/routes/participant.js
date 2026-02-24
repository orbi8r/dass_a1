var router = require('express').Router();
var auth = require('../middleware/auth');
var User = require('../models/User');
var Event = require('../models/Event');
var Registration = require('../models/Registration');
var QRCode = require('qrcode');
var bcrypt = require('bcryptjs');
var crypto = require('crypto');
var multer = require('multer');
var path = require('path');
var {sendTicketEmail} = require('../mailer');

var storage = multer.diskStorage({
  destination: function(req,file,cb){ cb(null, path.join(__dirname,'..','uploads')); },
  filename: function(req,file,cb){ cb(null, Date.now()+'-'+file.originalname); }
});
var upload = multer({storage:storage});

function strip(u){ var o = u.toObject(); delete o.password; return o; }

function genTicketId(){
  return 'TKT-'+Date.now()+'-'+crypto.randomBytes(3).toString('hex').toUpperCase();
}

/*9.2*/
router.get('/registrations', auth, async function(req,res){
  var regs = await Registration.find({userId:req.user._id})
    .populate({path:'eventId',populate:{path:'organizerId',select:'organizerName'}})
    .populate('teamId');
  res.json(regs);
});

/*9.5*/
router.post('/register/:eventId', auth, async function(req,res){
  if(req.user.role!=='participant') return res.status(403).json({msg:'participants only'});
  var evt = await Event.findById(req.params.eventId);
  if(!evt) return res.status(404).json({msg:'event not found'});
  if(evt.status!=='published') return res.status(400).json({msg:'not open for registration'});
  if(evt.registrationDeadline && new Date()>new Date(evt.registrationDeadline))
    return res.status(400).json({msg:'deadline passed'});
  if(evt.eligibility!=='all' && evt.eligibility!==req.user.participantType)
    return res.status(400).json({msg:'not eligible'});
  var exists = await Registration.findOne({eventId:evt._id, userId:req.user._id});
  if(exists) return res.status(400).json({msg:'already registered'});
  if(evt.isTeamEvent) return res.status(400).json({msg:'use team registration'});
  var cond = {_id:evt._id};
  if(evt.registrationLimit) cond.$expr = {$lt:['$registrationCount','$registrationLimit']};
  var upd = await Event.findOneAndUpdate(cond, {$inc:{registrationCount:1}}, {new:true});
  if(!upd) return res.status(400).json({msg:'full'});
  if(upd.customForm && upd.customForm.length>0 && !upd.formLocked){ upd.formLocked=true; await upd.save(); }

  /*9.5*/
  var fd = req.body.formData || {};
  if(upd.customForm && upd.customForm.length>0){
    for(var fi=0;fi<upd.customForm.length;fi++){
      var cf=upd.customForm[fi];
      if(cf.required && !fd[cf.label]) return res.status(400).json({msg:'required field missing: '+cf.label});
    }
  }

  var tid = genTicketId();
  var qr = await QRCode.toDataURL('TICKET:'+tid+'|EVENT:'+evt.name+'|USER:'+req.user.firstName+' '+req.user.lastName);
  var reg = await Registration.create({
    eventId:evt._id, userId:req.user._id, status:'registered',
    ticketId:tid, qrData:qr, formData:fd,
    paymentStatus: (evt.registrationFee && evt.registrationFee>0) ? 'pending' : 'none',
    totalAmount: (evt.registrationFee && evt.registrationFee>0) ? evt.registrationFee : 0
  });
  sendTicketEmail(req.user.email, evt.name, req.user.firstName, tid, qr, evt.type);
  res.status(201).json(reg);
});

/*9.5*/
router.post('/purchase/:eventId', auth, upload.single('paymentProof'), async function(req,res){
  if(req.user.role!=='participant') return res.status(403).json({msg:'participants only'});
  var evt = await Event.findById(req.params.eventId);
  if(!evt || evt.type!=='merchandise') return res.status(400).json({msg:'bad event'});
  if(evt.status!=='published') return res.status(400).json({msg:'not available'});

  var cartItems = typeof req.body.items==='string' ? JSON.parse(req.body.items) : (req.body.items||[]);
  if(!cartItems.length) return res.status(400).json({msg:'cart is empty'});
  var total = 0;

  for(var i=0; i<cartItems.length; i++){
    var ci = cartItems[i];
    var item = evt.items[ci.itemIndex];
    if(!item) return res.status(400).json({msg:'bad item'});
    var variant = item.variants[ci.variantIndex];
    if(!variant) return res.status(400).json({msg:'bad variant'});
    if(variant.stock < ci.quantity) return res.status(400).json({msg:item.name+' out of stock'});
    var prevRegs = await Registration.find({eventId:evt._id, userId:req.user._id, paymentStatus:{$in:['pending','approved']}});
    var prevQty = 0;
    prevRegs.forEach(function(pr){ pr.items.forEach(function(pi){ if(pi.itemIndex===ci.itemIndex) prevQty+=pi.quantity; }); });
    if(prevQty+ci.quantity > item.purchaseLimit) return res.status(400).json({msg:'purchase limit exceeded for '+item.name});
    total += item.price * ci.quantity;
  }

  total += (evt.registrationFee || 0);
  var tid = genTicketId();
  var qr = await QRCode.toDataURL('TICKET:'+tid+'|EVENT:'+evt.name+'|USER:'+req.user.firstName+' '+req.user.lastName);
  cartItems.forEach(function(ci){ evt.items[ci.itemIndex].variants[ci.variantIndex].stock -= ci.quantity; });
  await evt.save();

  var reg = await Registration.create({
    eventId:evt._id, userId:req.user._id, status:'registered',
    ticketId:tid, qrData:qr,
    items:cartItems, totalAmount:total,
    paymentProof: req.file ? req.file.filename : null,
    paymentStatus: req.file ? 'pending' : 'none'
  });
  evt.registrationCount++;
  await evt.save();
  sendTicketEmail(req.user.email, evt.name, req.user.firstName, tid, qr, evt.type);
  res.status(201).json(reg);
});

/*13.1.2*/
router.post('/ticket/:ticketId/proof', auth, upload.single('paymentProof'), async function(req,res){
  if(!req.file) return res.status(400).json({msg:'no proof uploaded'});
  var reg = await Registration.findOne({ticketId:req.params.ticketId, userId:req.user._id});
  if(!reg) return res.status(404).json({msg:'ticket not found'});
  reg.paymentProof = req.file.filename;
  reg.paymentStatus = 'pending';
  reg.status = 'registered';
  await reg.save();
  res.json(reg);
});

/*9.5*/
router.get('/ticket/:ticketId', auth, async function(req,res){
  var reg = await Registration.findOne({ticketId:req.params.ticketId}).populate('eventId').populate('userId','firstName lastName email');
  if(!reg) return res.status(404).json({msg:'ticket not found'});
  res.json(reg);
});

/*9.6*/
router.put('/profile', auth, async function(req,res){
  if(req.user.role!=='participant') return res.status(403).json({msg:'nope'});
  var b = req.body;
  var u = await User.findById(req.user._id);
  if(b.firstName!==undefined) u.firstName = b.firstName;
  if(b.lastName!==undefined) u.lastName = b.lastName;
  if(b.contactNumber!==undefined) u.contactNumber = b.contactNumber;
  if(b.college!==undefined) u.college = b.college;
  if(b.interests!==undefined) u.interests = b.interests;
  if(b.followedClubs!==undefined) u.followedClubs = b.followedClubs;
  await u.save();
  res.json(strip(u));
});

/*5*/
router.post('/onboarding', auth, async function(req,res){
  var u = await User.findById(req.user._id);
  u.interests = req.body.interests || [];
  u.followedClubs = req.body.followedClubs || [];
  await u.save();
  res.json(strip(u));
});

/*9.7*/
router.post('/follow/:orgId', auth, async function(req,res){
  var u = await User.findById(req.user._id);
  var already = u.followedClubs.some(function(id){ return id.toString()===req.params.orgId; });
  if(!already) u.followedClubs.push(req.params.orgId);
  await u.save();
  res.json(strip(u));
});

/*9.7*/
router.delete('/follow/:orgId', auth, async function(req,res){
  var u = await User.findById(req.user._id);
  u.followedClubs = u.followedClubs.filter(function(id){ return id.toString()!==req.params.orgId; });
  await u.save();
  res.json(strip(u));
});

/*9.6*/
router.put('/password', auth, async function(req,res){
  if(!req.body.currentPassword || !req.body.newPassword) return res.status(400).json({msg:'missing fields'});
  if(req.body.newPassword.length < 6) return res.status(400).json({msg:'password must be at least 6 characters'});
  var u = await User.findById(req.user._id);
  var ok = await bcrypt.compare(req.body.currentPassword, u.password);
  if(!ok) return res.status(400).json({msg:'wrong current password'});
  u.password = await bcrypt.hash(req.body.newPassword, 10);
  await u.save();
  res.json({msg:'password changed'});
});

/*9.7*/
router.get('/organizers', async function(req,res){
  var orgs = await User.find({role:'organizer', active:true}).select('-password');
  res.json(orgs);
});

/*9.8*/
router.get('/organizers/:id', async function(req,res){
  var org = await User.findById(req.params.id).select('-password');
  if(!org || org.role!=='organizer') return res.status(404).json({msg:'not found'});
  var events = await Event.find({organizerId:org._id, status:{$in:['published','ongoing','completed']}}).sort({startDate:-1});
  res.json({organizer:org, events:events});
});

/*10.4*/
router.post('/upload', auth, upload.single('file'), async function(req,res){
  if(!req.file) return res.status(400).json({msg:'no file'});
  res.json({filename:req.file.filename});
});

module.exports = router;
