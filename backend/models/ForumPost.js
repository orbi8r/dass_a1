var mongoose = require('mongoose');
var S = mongoose.Schema;
/*13.2.1*/
var schema = new S({
  eventId: {type:S.Types.ObjectId, ref:'Event', required:true},
  userId: {type:S.Types.ObjectId, ref:'User', required:true},
  content: String,
  parentId: {type:S.Types.ObjectId, ref:'ForumPost', default:null},
  pinned: {type:Boolean, default:false},
  reactions: [{
    userId: {type:S.Types.ObjectId, ref:'User'},
    type: {type:String, default:'like'}
  }],
  deleted: {type:Boolean, default:false}
}, {timestamps:true});
module.exports = mongoose.model('ForumPost', schema);
