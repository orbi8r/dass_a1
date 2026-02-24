var mongoose = require('mongoose');
var S = mongoose.Schema;
var schema = new S({
  /*9.5*/
  eventId: {type:S.Types.ObjectId, ref:'Event', required:true},
  userId: {type:S.Types.ObjectId, ref:'User', required:true},
  status: {type:String, enum:['registered','completed','cancelled','rejected','pending_payment'], default:'registered'},
  ticketId: {type:String, unique:true, sparse:true},
  qrData: String,
  formData: S.Types.Mixed,
  teamId: {type:S.Types.ObjectId, ref:'Team'},
  /*13.1.2*/
  items: [{itemIndex:Number, variantIndex:Number, quantity:Number}],
  totalAmount: Number,
  paymentProof: String,
  paymentStatus: {type:String, enum:['none','pending','approved','rejected'], default:'none'},
  attended: {type:Boolean, default:false}
}, {timestamps:true});
module.exports = mongoose.model('Registration', schema);
