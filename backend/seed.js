/*4.1.3*/
var mongoose = require('mongoose');
var bcrypt= require('bcryptjs');
require('dotenv').config();
var User= require('./models/User');
mongoose.connect(process.env.MONGO_URI).then(async function(){
  var admin =await User.findOne({role:'admin'});
  if(!admin){
    var h=  await bcrypt.hash('admin123', 10);
    await User.create({firstName:'Admin',lastName:'User',email:'admin@felicity.gg',password:h,role:'admin'});
  }
  process.exit();
});
