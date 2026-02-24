var router= require('express').Router();
var bcrypt = require('bcryptjs');
var jwt=require('jsonwebtoken');
var User = require('../models/User');
var auth= require('../middleware/auth');

var SECRET= process.env.JWT_SECRET || 'orbi8r';

function strip(u){var o= u.toObject(); delete o.password; return o;}

/*4.1.1*/
router.post('/register', async function(req,res){
  var b = req.body;
  if(!b.email || !b.password || !b.firstName || !b.lastName)
    return res.status(400).json({msg:'missing required fields'});
  if(b.password.length < 6)
   return res.status(400).json({msg:'password must be at least 6 characters'});
  if(b.participantType==='iiit'){
    if(!b.email.endsWith('@iiit.ac.in') && !b.email.endsWith('@students.iiit.ac.in') && !b.email.endsWith('@research.iiit.ac.in'))
    return res.status(400).json({msg:'IIIT participants must use IIIT email domain'});
  }
   var exists= await User.findOne({email:b.email});
  if(exists) return res.status(400).json({msg:'email already registered'});
  var h =await bcrypt.hash(b.password, 10);
  var u= await User.create({
    firstName:b.firstName, lastName:b.lastName, email:b.email,
    password:h, role:'participant', participantType:b.participantType||'iiit',
    college:b.college, contactNumber:b.contactNumber
  });
  var token=jwt.sign({id:u._id}, SECRET, {expiresIn:'7d'});
  res.status(201).json({token,user:strip(u), needsOnboarding:true});
});

/*4.1*/
router.post('/login', async function(req,res){
  if(!req.body.email || !req.body.password) return res.status(400).json({msg:'bad credentials'});
  var u= await User.findOne({email:req.body.email});
  if(!u) return res.status(400).json({msg:'bad credentials'});
  if(!u.active) return res.status(403).json({msg:'account disabled'});
   var ok= await bcrypt.compare(req.body.password, u.password);
  if(!ok) return res.status(400).json({msg:'bad credentials'});
  var token = jwt.sign({id:u._id}, SECRET, {expiresIn:'7d'});
  res.json({token,  user:strip(u)});
});

/*4.2*/
router.get('/me', auth, function(req,res){
  res.json(req.user);
});

/*13.2.2*/
router.post('/forgot-password',async function(req,res){
  if(!req.body.email) return res.status(400).json({msg:'email required'});
 var u = await User.findOne({email:req.body.email});
  if(!u) return res.status(404).json({msg:'no account found with that email'});
  var PasswordReset= require('../models/PasswordReset');
  var pending=await PasswordReset.findOne({userId:u._id, status:'pending'});
  if(pending) return res.json({msg:'A password reset request is already pending. Please contact admin.'});
   await PasswordReset.create({userId:u._id, reason:req.body.reason||'Forgot password (from login page)'});
   res.json({msg:'Password reset request submitted. Contact your admin for the new password.'});
});

module.exports = router;
