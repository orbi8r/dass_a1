var mongoose = require('mongoose');
var S = mongoose.Schema;
var schema = new S({
  /*8*/
  name: {type:String, required:true},
  description: String,
  type: {type:String, enum:['normal','merchandise'], required:true},
  eligibility: {type:String, enum:['all','iiit','non-iiit'], default:'all'},
  /*7.1*/
  registrationDeadline: Date,
  startDate: Date,
  endDate: Date,
  registrationLimit: Number,
  registrationFee: {type:Number, default:0},
  organizerId: {type:S.Types.ObjectId, ref:'User', required:true},
  tags: [String],
  status: {type:String, enum:['draft','published','ongoing','completed','closed'], default:'draft'},
  customForm: [{
    label: String,
    fieldType: {type:String, enum:['text','textarea','dropdown','checkbox','file']},
    options: [String],
    required: {type:Boolean, default:false},
    order: Number
  }],
  formLocked: {type:Boolean, default:false},
  /*7.2*/
  items: [{
    name: String,
    price: Number,
    variants: [{size:String, color:String, stock:Number}],
    purchaseLimit: {type:Number, default:1}
  }],
  /*13.1.1*/
  isTeamEvent: {type:Boolean, default:false},
  minTeamSize: {type:Number, default:2},
  maxTeamSize: {type:Number, default:4},
  /*7.1*/
  registrationCount: {type:Number, default:0}
}, {timestamps:true});
module.exports = mongoose.model('Event', schema);
