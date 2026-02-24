var mongoose = require('mongoose');
var S = mongoose.Schema;
/*13.2.2*/
var schema = new S({
  userId: {type:S.Types.ObjectId, ref:'User', required:true},
  reason: String,
  status: {type:String, enum:['pending','approved','rejected'], default:'pending'},
  adminComment: String,
  newPassword: String
}, {timestamps:true});
module.exports = mongoose.model('PasswordReset', schema);
