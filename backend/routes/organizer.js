var router = require('express').Router();
var auth = require('../middleware/auth');
var Event = require('../models/Event');
var Registration = require('../models/Registration');
var User = require('../models/User');
var PasswordReset = require('../models/PasswordReset');
var Team = require('../models/Team');
var QRCode = require('qrcode');
var crypto = require('crypto');
var {sendPaymentApprovedEmail} = require('../mailer');

function chkOrg(req,res){ if(req.user.role!=='organizer'){ res.status(403).json({msg:'nope'}); return false; } return true; }

/*10.2*/
router.get('/events', auth, async function(req,res){
  if(!chkOrg(req,res)) return;
  var evts = await Event.find({organizerId:req.user._id}).sort({createdAt:-1});
  res.json(evts);
});

/*10.3*/
router.get('/events/:id', auth, async function(req,res){
  if(!chkOrg(req,res)) return;
  var e = await Event.findById(req.params.id);
  if(!e || e.organizerId.toString()!==req.user._id.toString()) return res.status(403).json({msg:'nah'});
  var regs = await Registration.find({eventId:e._id}).populate('userId','firstName lastName email contactNumber').populate('teamId');
  var totalRevenue = 0, approved = 0, attendance = 0;
  regs.forEach(function(r){
    if(r.paymentStatus==='approved' && r.totalAmount) totalRevenue += r.totalAmount;
    if(r.status==='registered' || r.paymentStatus==='approved') approved++;
    if(r.attended) attendance++;
  });
  var teams = await Team.find({eventId:e._id});
  var teamComplete = teams.filter(function(t){return t.isComplete}).length;
  res.json({event:e, registrations:regs, analytics:{total:regs.length, approved:approved, revenue:totalRevenue, attendance:attendance, teamComplete:teamComplete, teamTotal:teams.length}});
});

/*10.3*/
router.get('/events/:id/participants', auth, async function(req,res){
  if(!chkOrg(req,res)) return;
  var e = await Event.findById(req.params.id);
  if(!e || e.organizerId.toString()!==req.user._id.toString()) return res.status(403).json({msg:'nah'});
  var regs = await Registration.find({eventId:e._id}).populate('userId','firstName lastName email contactNumber').populate('teamId','name');
  var filtered = regs;
  if(req.query.search){
    var s = req.query.search.toLowerCase();
    filtered = filtered.filter(function(r){ return (r.userId.firstName+' '+r.userId.lastName).toLowerCase().indexOf(s)!==-1 || r.userId.email.toLowerCase().indexOf(s)!==-1; });
  }
  if(req.query.status) filtered = filtered.filter(function(r){ return r.status===req.query.status || r.paymentStatus===req.query.status; });
  res.json(filtered);
});

/*10.3*/
router.get('/events/:id/export', auth, async function(req,res){
  if(!chkOrg(req,res)) return;
  var e = await Event.findById(req.params.id);
  if(!e || e.organizerId.toString()!==req.user._id.toString()) return res.status(403).json({msg:'nah'});
  var regs = await Registration.find({eventId:e._id}).populate('userId','firstName lastName email contactNumber').populate('teamId','name');
  var csv = 'Name,Email,RegDate,Status,Payment,Team,TicketID,Attended\n';
  regs.forEach(function(r){
    csv += (r.userId.firstName+' '+r.userId.lastName)+','+r.userId.email+','
      +new Date(r.createdAt).toISOString().split('T')[0]+','+r.status+','+r.paymentStatus+','
      +(r.teamId?r.teamId.name:'')+',' +(r.ticketId||'')+','+(r.attended?'Yes':'No')+'\n';
  });
  res.setHeader('Content-Type','text/csv');
  res.setHeader('Content-Disposition','attachment; filename=participants.csv');
  res.send(csv);
});

/*13.1.2*/
router.patch('/events/:id/payment/:regId', auth, async function(req,res){
  if(!chkOrg(req,res)) return;
  var e = await Event.findById(req.params.id);
  if(!e || e.organizerId.toString()!==req.user._id.toString()) return res.status(403).json({msg:'nah'});
  var reg = await Registration.findById(req.params.regId);
  if(!reg || reg.eventId.toString()!==e._id.toString()) return res.status(404).json({msg:'not found'});
  if(req.body.action==='approve'){
    reg.paymentStatus = 'approved';
    if(!reg.ticketId){
      var tid = 'TKT-'+Date.now()+'-'+crypto.randomBytes(3).toString('hex').toUpperCase();
      var qr = await QRCode.toDataURL('TICKET:'+tid+'|EVENT:'+e.name);
      reg.ticketId = tid; reg.qrData = qr;
    }
    reg.status = 'registered';
  } else {
    if(reg.items && reg.items.length){
      reg.items.forEach(function(ci){ e.items[ci.itemIndex].variants[ci.variantIndex].stock += ci.quantity; });
      await e.save();
    }
    reg.paymentStatus = 'rejected'; reg.status = 'rejected';
  }
  await reg.save();
  if(req.body.action==='approve'){
    var regUser = await User.findById(reg.userId);
    if(regUser) sendPaymentApprovedEmail(regUser.email, e.name, regUser.firstName, reg.ticketId);
  }
  res.json(reg);
});

/*10.3*/
router.patch('/events/:id/attend/:regId', auth, async function(req,res){
  if(!chkOrg(req,res)) return;
  var e = await Event.findById(req.params.id);
  if(!e || e.organizerId.toString()!==req.user._id.toString()) return res.status(403).json({msg:'nah'});
  var reg = await Registration.findById(req.params.regId);
  if(!reg || reg.eventId.toString()!==e._id.toString()) return res.status(404).json({msg:'not found'});
  reg.attended = !reg.attended;
  await reg.save();
  res.json(reg);
});

/*10.5*/
router.put('/profile', auth, async function(req,res){
  if(!chkOrg(req,res)) return;
  var u = await User.findById(req.user._id);
  var b = req.body;
  if(b.organizerName!==undefined) u.organizerName = b.organizerName;
  if(b.clubName!==undefined) u.organizerName = b.clubName;
  if(b.category!==undefined) u.category = b.category;
  if(b.description!==undefined) u.description = b.description;
  if(b.contactEmail!==undefined) u.contactEmail = b.contactEmail;
  if(b.contactNumber!==undefined) u.contactNumber = b.contactNumber;
  if(b.discordWebhook!==undefined) u.discordWebhook = b.discordWebhook;
  await u.save();
  var out = u.toObject(); delete out.password;
  res.json(out);
});

/*13.2.2*/
router.post('/password-reset', auth, async function(req,res){
  if(!chkOrg(req,res)) return;
  var pending = await PasswordReset.findOne({userId:req.user._id, status:'pending'});
  if(pending) return res.json({msg:'A reset request is already pending. Please wait for admin.'});
  await PasswordReset.create({userId:req.user._id, reason:req.body.reason||'Password reset request'});
  res.json({msg:'request submitted'});
});

/*13.2.2*/
router.get('/password-resets', auth, async function(req,res){
  if(!chkOrg(req,res)) return;
  var resets = await PasswordReset.find({userId:req.user._id}).sort({createdAt:-1});
  res.json(resets);
});

/*10.2*/
router.get('/analytics', auth, async function(req,res){
  if(!chkOrg(req,res)) return;
  var evts = await Event.find({organizerId:req.user._id, status:{$in:['completed','closed']}});
  var ids = evts.map(function(e){return e._id});
  var regs = await Registration.find({eventId:{$in:ids}});
  var totalRevenue = 0, attendance = 0;
  regs.forEach(function(r){
    if(r.paymentStatus==='approved' && r.totalAmount) totalRevenue+=r.totalAmount;
    if(r.attended) attendance++;
  });
  res.json({totalEvents:evts.length, totalRegistrations:regs.length, totalRevenue:totalRevenue, attendance:attendance});
});

module.exports = router;
