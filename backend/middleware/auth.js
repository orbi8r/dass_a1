/*4.2*/
var jwt= require('jsonwebtoken');
var User = require('../models/User');
module.exports= async function(req, res, next){
  var h= req.headers.authorization;
 var token;
 if(h) token = h.split(' ')[1];
  else if(req.query.token) token =req.query.token;
  if(!token) return res.status(401).json({msg:'no token'});
   try{
    var d= jwt.verify(token, process.env.JWT_SECRET || 'orbi8r');
    req.user= await User.findById(d.id).select('-password');
   if(!req.user||!req.user.active) return res.status(401).json({msg:'nope'});
   next();
  } catch(e){
    res.status(401).json({msg:'bad token'});
  }
};
