/*11.2*/
var router= require('express').Router();
var auth = require('../middleware/auth');
var User= require('../models/User');
var PasswordReset = require('../models/PasswordReset');
var bcrypt= require('bcryptjs');
var crypto= require('crypto');

function chkAdmin(req,res){ if(req.user.role!=='admin'){ res.status(403).json({msg:'admin only'}); return false; } return true; }

/*11.2*/
router.get('/organizers', auth,async function(req,res){
  if(!chkAdmin(req,res)) return;
  var orgs = await User.find({role:'organizer'}).select('-password');
  res.json(orgs);
});

/*11.2*/
router.post('/organizers', auth, async function(req,res){
 if(!chkAdmin(req,res)) return;
  var b = req.body;
   if(!b.email) return res.status(400).json({msg:'email required'});
  var exists = await User.findOne({email:b.email});
 if(exists) return res.status(400).json({msg:'email taken'});
  var orgName= b.organizerName || b.clubName ||'Org';
  var pwd = crypto.randomBytes(6).toString('hex');
  var h= await bcrypt.hash(pwd, 10);
 var u = await User.create({
     firstName:orgName, lastName:'', email:b.email, password:h,
    role:'organizer',organizerName:orgName, category:b.category,
    description:b.description||'', contactEmail:b.email
  });
  res.status(201).json({user: (function(){ var o=u.toObject();delete o.password; return o; })(), generatedPassword:pwd});
});

/*11.2*/
router.delete('/organizers/:id',auth, async function(req,res){
  if(!chkAdmin(req,res)) return;
  var action= req.query.action|| 'disable';
  if(action==='delete'){
    await User.findByIdAndDelete(req.params.id);
    res.json({msg:'deleted'});
  } else if(action==='archive'){
    var u =  await User.findById(req.params.id);
    u.active = false; u.archived = true;
    await u.save();
    res.json({msg:'archived'});
 } else{
    var u = await User.findById(req.params.id);
   u.active = false;
     await u.save();
    res.json({msg:'disabled'});
  }
});

/*11.2*/
router.patch('/organizers/:id/enable', auth, async function(req,res){
  if(!chkAdmin(req,res))return;
  var u  = await User.findById(req.params.id);
  u.active = true;
  await u.save();
  res.json({msg:'enabled'});
});

/*13.2.2*/
router.get('/password-resets', auth, async function(req,res){
  if(!chkAdmin(req,res)) return;
  var resets= await PasswordReset.find().populate('userId','firstName lastName organizerName email role category').sort({createdAt:-1});
 res.json(resets);
});

/*13.2.2*/
router.patch('/password-resets/:id', auth, async function(req,res){
  if(!chkAdmin(req,res)) return;
  var pr= await PasswordReset.findById(req.params.id);
 if(!pr) return res.status(404).json({msg:'not found'});
  if(req.body.action==='approve'){
     var newPwd= req.body.customPassword || crypto.randomBytes(6).toString('hex');
    if(newPwd.length < 6) return res.status(400).json({msg:'password must be at least 6 characters'});
   var h = await bcrypt.hash(newPwd, 10);
    await User.findByIdAndUpdate(pr.userId, {password:h});
     pr.status ='approved'; pr.newPassword = newPwd; pr.adminComment = req.body.comment||'';
   await pr.save();
    res.json({msg:'approved', newPassword:newPwd});
  }else {
    pr.status = 'rejected';  pr.adminComment = req.body.comment||'';
    await pr.save();
   res.json({msg:'rejected'});
  }
});

/*11.2*/
router.post('/reset-password/:userId', auth, async function(req,res){
  if(!chkAdmin(req,res)) return;
   var u= await User.findById(req.params.userId);
  if(!u) return res.status(404).json({msg:'user not found'});
  var newPwd = req.body.password || crypto.randomBytes(6).toString('hex');
  if(newPwd.length < 6) return res.status(400).json({msg:'password must be at least 6 characters'});
   var h = await bcrypt.hash(newPwd, 10);
  u.password= h;
  await u.save();
  res.json({msg:'password reset', newPassword:newPwd});
});

module.exports = router;
