/*13.3.1*/
var router = require('express').Router();
var auth = require('../middleware/auth');
var Event = require('../models/Event');
var Feedback = require('../models/Feedback');
var Registration = require('../models/Registration');

/*13.3.1*/
router.post('/:eventId', auth, async function(req,res){
  var evt = await Event.findById(req.params.eventId);
  if(!evt) return res.status(404).json({msg:'event not found'});
  var regQuery = {eventId:req.params.eventId, userId:req.user._id};
  if(evt.type==='merchandise'){
    regQuery.paymentStatus = 'approved';
  } else {
    regQuery.status = 'registered';
  }
  var reg = await Registration.findOne(regQuery);
  if(!reg) return res.status(400).json({msg: evt.type==='merchandise' ? 'your purchase must be approved before leaving feedback' : 'you must be registered for this event to leave feedback'});
  var existing = await Feedback.findOne({eventId:req.params.eventId, userId:req.user._id});
  if(existing) return res.status(400).json({msg:'already submitted feedback'});
  var rating = Number(req.body.rating);
  if(!rating || rating<1 || rating>5) return res.status(400).json({msg:'rating must be 1-5'});
  var fb = await Feedback.create({eventId:req.params.eventId, userId:req.user._id, rating:rating, comment:req.body.comment||''});
  res.status(201).json(fb);
});

/*13.3.1*/
router.get('/:eventId', async function(req,res){
  var query = {eventId:req.params.eventId};
  if(req.query.rating) query.rating = Number(req.query.rating);
  var fbs = await Feedback.find(query).sort({createdAt:-1});
  var allFbs = await Feedback.find({eventId:req.params.eventId});
  var avg = allFbs.length ? allFbs.reduce(function(s,f){return s+f.rating},0)/allFbs.length : 0;
  var clean = fbs.map(function(f){ return {rating:f.rating, comment:f.comment, createdAt:f.createdAt, _id:f._id}; });
  res.json({feedback:clean, averageRating:Math.round(avg*10)/10, count:allFbs.length});
});

module.exports = router;
