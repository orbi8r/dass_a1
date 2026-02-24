var mongoose = require('mongoose');
var S = mongoose.Schema;
/*13.1.1*/
var schema = new S({
  eventId: {type:S.Types.ObjectId, ref:'Event', required:true},
  name: String,
  leaderId: {type:S.Types.ObjectId, ref:'User', required:true},
  inviteCode: {type:String, unique:true},
  members: [{
    userId: {type:S.Types.ObjectId, ref:'User'},
    status: {type:String, enum:['pending','accepted','rejected'], default:'pending'}
  }],
  maxSize: Number,
  minSize: Number,
  isComplete: {type:Boolean, default:false}
}, {timestamps:true});
module.exports = mongoose.model('Team', schema);
