/*13.2.1*/
var router = require('express').Router();
var auth = require('../middleware/auth');
var ForumPost = require('../models/ForumPost');
var Event = require('../models/Event');

/*13.2.1*/
router.get('/:eventId', async function(req,res){
  var posts = await ForumPost.find({eventId:req.params.eventId, deleted:false})
    .populate('userId','firstName lastName role organizerName')
    .sort({pinned:-1, createdAt:1});
  res.json(posts);
});

/*13.2.1*/
router.post('/:eventId', auth, async function(req,res){
  var post = await ForumPost.create({
    eventId:req.params.eventId, userId:req.user._id,
    content:req.body.content, parentId:req.body.parentId||null
  });
  post = await ForumPost.findById(post._id).populate('userId','firstName lastName role organizerName');
  var io = req.app.get('io');
  if(io) io.to('evt_'+req.params.eventId).emit('newPost', post);
  res.status(201).json(post);
});

/*13.2.1*/
router.delete('/:postId', auth, async function(req,res){
  var post = await ForumPost.findById(req.params.postId);
  if(!post) return res.status(404).json({msg:'not found'});
  var evt = await Event.findById(post.eventId);
  var canDel = (req.user.role==='organizer' && evt && evt.organizerId.toString()===req.user._id.toString())
    || post.userId.toString()===req.user._id.toString();
  if(!canDel) return res.status(403).json({msg:'nope'});
  post.deleted = true;
  await post.save();
  var io = req.app.get('io');
  if(io) io.to('evt_'+post.eventId).emit('deletePost', post._id);
  res.json({msg:'deleted'});
});

/*13.2.1*/
router.patch('/:postId/pin', auth, async function(req,res){
  var post = await ForumPost.findById(req.params.postId);
  if(!post) return res.status(404).json({msg:'nope'});
  var evt = await Event.findById(post.eventId);
  if(req.user.role!=='organizer' || !evt || evt.organizerId.toString()!==req.user._id.toString())
    return res.status(403).json({msg:'nope'});
  post.pinned = !post.pinned;
  await post.save();
  post = await ForumPost.findById(post._id).populate('userId','firstName lastName role organizerName');
  var io = req.app.get('io');
  if(io) io.to('evt_'+post.eventId).emit('updatePost', post);
  res.json(post);
});

/*13.2.1*/
router.post('/:postId/react', auth, async function(req,res){
  var post = await ForumPost.findById(req.params.postId);
  if(!post) return res.status(404).json({msg:'nope'});
  var type = req.body.type || req.body.emoji || 'like';
  var idx = post.reactions.findIndex(function(r){ return r.userId.toString()===req.user._id.toString() && r.type===type; });
  if(idx!==-1) post.reactions.splice(idx,1);
  else post.reactions.push({userId:req.user._id, type:type});
  await post.save();
  post = await ForumPost.findById(post._id).populate('userId','firstName lastName role organizerName');
  var io = req.app.get('io');
  if(io) io.to('evt_'+post.eventId).emit('updatePost', post);
  res.json(post);
});

module.exports = router;
