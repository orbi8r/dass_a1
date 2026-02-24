var mongoose = require('mongoose');
var S = mongoose.Schema;
var schema = new S({
  /*6.1*/
  firstName: String,
  lastName: String,
  /*4.2*/
  email: {type:String, unique:true, required:true},
  password: {type:String, required:true},
  role: {type:String, enum:['participant','organizer','admin'], default:'participant'},
  /*6.1*/
  participantType: {type:String, enum:['iiit','non-iiit']},
  college: String,
  contactNumber: String,
  /*5*/
  interests: [String],
  followedClubs: [{type:S.Types.ObjectId, ref:'User'}],
  /*6.2*/
  organizerName: String,
  category: String,
  description: String,
  contactEmail: String,
  /*10.5*/
  discordWebhook: String,
  /*4.2*/
  active: {type:Boolean, default:true},
  archived: {type:Boolean, default:false}
}, {timestamps:true});
module.exports = mongoose.model('User', schema);
