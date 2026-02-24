/*13.1.1*/
var router = require('express').Router();
var auth = require('../middleware/auth');
var Team = require('../models/Team');
var Event = require('../models/Event');
var Registration = require('../models/Registration');
var User = require('../models/User');
var QRCode = require('qrcode');
var crypto = require('crypto');
var {sendTicketEmail} = require('../mailer');

/*13.1.1*/
router.post('/', auth, async function(req,res){
  var evt = await Event.findById(req.body.eventId);
  if(!evt || !evt.isTeamEvent) return res.status(400).json({msg:'not a team event'});
  if(evt.status!=='published') return res.status(400).json({msg:'not open'});
  if(evt.eligibility!=='all' && evt.eligibility!==req.user.participantType)
    return res.status(400).json({msg:'not eligible for this event'});
  var existing = await Team.findOne({eventId:evt._id, $or:[{leaderId:req.user._id},{'members.userId':req.user._id}]});
  if(existing) return res.status(400).json({msg:'already in a team for this event'});
  var code = crypto.randomBytes(4).toString('hex').toUpperCase();
  var team = await Team.create({
    eventId:evt._id, name:req.body.name, leaderId:req.user._id,
    inviteCode:code, members:[{userId:req.user._id, status:'accepted'}],
    maxSize:evt.maxTeamSize, minSize:evt.minTeamSize
  });
  res.status(201).json(team);
});

/*13.1.1*/
router.post('/join', auth, async function(req,res){
  var team = await Team.findOne({inviteCode:req.body.inviteCode});
  if(!team) return res.status(404).json({msg:'invalid invite code'});
  if(team.isComplete) return res.status(400).json({msg:'team already complete'});
  if(team.members.length>=team.maxSize) return res.status(400).json({msg:'team full'});
  var existing = await Team.findOne({eventId:team.eventId, $or:[{leaderId:req.user._id},{'members.userId':req.user._id}]});
  if(existing) return res.status(400).json({msg:'already in a team'});
  team.members.push({userId:req.user._id, status:'pending'});
  await team.save();
  res.json(team);
});

/*13.1.1*/
router.patch('/:id/respond', auth, async function(req,res){
  var team = await Team.findById(req.params.id);
  if(!team) return res.status(404).json({msg:'not found'});
  var member = team.members.find(function(m){ return m.userId.toString()===req.user._id.toString(); });
  if(!member) return res.status(403).json({msg:'not in this team'});
  member.status = req.body.status;
  await team.save();

  var accepted = team.members.filter(function(m){ return m.status==='accepted'; });
  if(accepted.length >= team.minSize && accepted.length <= team.maxSize){
    team.isComplete = true;
    await team.save();
    var evt = await Event.findById(team.eventId);
    var created = 0;
    for(var i=0; i<accepted.length; i++){
      var m = accepted[i];
      var exists = await Registration.findOne({eventId:team.eventId, userId:m.userId});
      if(!exists){
        var tid = 'TKT-'+Date.now()+'-'+crypto.randomBytes(3).toString('hex').toUpperCase();
        var qr = await QRCode.toDataURL('TICKET:'+tid+'|EVENT:'+(evt?evt.name:'')+'|TEAM:'+team.name);
        await Registration.create({eventId:team.eventId, userId:m.userId, status:'registered', ticketId:tid, qrData:qr, teamId:team._id});
        var mu = await User.findById(m.userId);
        if(mu) sendTicketEmail(mu.email, evt?evt.name:'Event', mu.firstName, tid, qr, 'team');
        created++;
      }
    }
    if(evt && created){ evt.registrationCount += created; await evt.save(); }
  }
  res.json(team);
});

/*13.1.1*/
router.get('/event/:eventId', auth, async function(req,res){
  var team = await Team.findOne({eventId:req.params.eventId,'members.userId':req.user._id}).populate('members.userId','firstName lastName email');
  res.json(team);
});

/*13.1.1*/
router.get('/:id', auth, async function(req,res){
  var team = await Team.findById(req.params.id).populate('members.userId','firstName lastName email');
  res.json(team);
});

module.exports = router;
