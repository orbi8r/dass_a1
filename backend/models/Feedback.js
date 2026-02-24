var mongoose= require('mongoose');
var S = mongoose.Schema;
/*13.3.1*/
var schema= new S({
  eventId: {type:S.Types.ObjectId, ref:'Event', required:true},
 userId: {type:S.Types.ObjectId, ref:'User', required:true},
 rating: {type:Number, min:1, max:5, required:true},
  comment: String
},{timestamps:true});
module.exports = mongoose.model('Feedback',  schema);
