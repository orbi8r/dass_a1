var router = require('express').Router();
var Event = require('../models/Event');
var Registration = require('../models/Registration');
var User = require('../models/User');
var auth = require('../middleware/auth');
var jwt = require('jsonwebtoken');

/*4.2*/
async function optionalAuth(req,res,next){
  var h = req.headers.authorization;
  var token;
  if(h) token = h.split(' ')[1];
  else if(req.query.token) token = req.query.token;
  if(!token) return next();
  try {
    var d = jwt.verify(token, process.env.JWT_SECRET || 'orbi8r');
    req.user = await User.findById(d.id).select('-password');
  } catch(e){}
  next();
}

/*9.3*/
function levenshtein(a,b){
  var m=a.length, n=b.length, d=[];
  for(var i=0;i<=m;i++) d[i]=[i];
  for(var j=0;j<=n;j++) d[0][j]=j;
  for(i=1;i<=m;i++) for(j=1;j<=n;j++){
    d[i][j] = Math.min(d[i-1][j]+1, d[i][j-1]+1, d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  }
  return d[m][n];
}

function fuzzyScore(query, text){
  if(!text) return 0;
  var q = query.toLowerCase(), t = text.toLowerCase();
  if(t.indexOf(q)!==-1) return 100;
  var words = q.split(/\s+/).filter(function(w){return w.length>0});
  var score = 0;
  words.forEach(function(w){
    if(t.indexOf(w)!==-1){ score += 50; return; }
    var tWords = t.split(/\s+/);
    var bestDist = Infinity;
    tWords.forEach(function(tw){
      var len = Math.min(w.length + 2, tw.length);
      var d = levenshtein(w, tw.substring(0, len));
      if(d < bestDist) bestDist = d;
      if(tw.length > w.length + 2){
        var d2 = levenshtein(w, tw.substring(0, w.length));
        if(d2 < bestDist) bestDist = d2;
      }
    });
    var threshold = Math.max(1, Math.floor(w.length/3));
    if(bestDist <= threshold) score += 30 - bestDist*5;
    else {
      var pat = w.split('').map(function(c){return c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}).join('.*?');
      if(new RegExp(pat,'i').test(t)) score += 10;
    }
  });
  return score;
}

/*9.3*/
router.get('/', optionalAuth, async function(req,res){
  var q = {status:{$in:['published','ongoing','completed']}};

  if(req.query.type) q.type = req.query.type;
  if(req.query.eligibility && req.query.eligibility!=='all') q.eligibility = {$in:[req.query.eligibility,'all']};
  if(!req.query.eligibility && req.user && req.user.role==='participant' && req.user.participantType){
    q.eligibility = {$in:[req.user.participantType, 'all']};
  }
  if(req.query.dateFrom || req.query.dateTo){
    q.startDate = {};
    if(req.query.dateFrom) q.startDate.$gte = new Date(req.query.dateFrom);
    if(req.query.dateTo){ var d = new Date(req.query.dateTo); d.setUTCHours(23,59,59,999); q.startDate.$lte = d; }
  }
  if(req.query.organizer) q.organizerId = req.query.organizer;
  if(req.query.followed) q.organizerId = {$in:req.query.followed.split(',')};
  if(req.query.category){
    var catOrgs = await User.find({role:'organizer',category:req.query.category}).select('_id');
    if(!catOrgs.length) return res.json([]);
    q.organizerId = {$in:catOrgs.map(function(o){return o._id})};
  }

  var events = await Event.find(q).populate('organizerId','organizerName category').sort({createdAt:-1});

  if(req.query.search){
    var searchQ = req.query.search;
    var scored = events.map(function(evt){
      var combined = [evt.name, evt.description, (evt.tags||[]).join(' '), evt.organizerId?.organizerName||''].join(' ');
      var s = fuzzyScore(searchQ, combined);
      return {event:evt, score:s};
    }).filter(function(item){ return item.score > 0; })
      .sort(function(a,b){ return b.score - a.score; });
    events = scored.map(function(item){ return item.event; });
  }

  res.json(events);
});

/*9.3*/
router.get('/trending', async function(req,res){
  var since = new Date(Date.now() - 24*60*60*1000);
  var top = await Registration.aggregate([
    {$match:{createdAt:{$gte:since}}},
    {$group:{_id:'$eventId',count:{$sum:1}}},
    {$sort:{count:-1}},
    {$limit:5}
  ]);
  var ids = top.map(function(t){return t._id});
  var events = await Event.find({_id:{$in:ids}}).populate('organizerId','organizerName');
  var ordered = ids.map(function(id){ return events.find(function(e){ return e._id.toString()===id.toString(); }); }).filter(Boolean);
  res.json(ordered);
});

/*9.4*/
router.get('/:id', async function(req,res){
  var e = await Event.findById(req.params.id).populate('organizerId','organizerName category description contactEmail');
  if(!e) return res.status(404).json({msg:'not found'});
  res.json(e);
});

/*10.4*/
router.post('/', auth, async function(req,res){
  if(req.user.role!=='organizer') return res.status(403).json({msg:'organizers only'});
  var b = req.body;
  b.organizerId = req.user._id;
  if(!b.type) b.type = 'normal';
  var e = await Event.create(b);
  res.status(201).json(e);
});

/*10.4*/
router.put('/:id', auth, async function(req,res){
  if(req.user.role!=='organizer') return res.status(403).json({msg:'nope'});
  var e = await Event.findById(req.params.id);
  if(!e) return res.status(404).json({msg:'not found'});
  if(e.organizerId.toString()!==req.user._id.toString()) return res.status(403).json({msg:'not yours'});
  var b = req.body;
  if(e.status==='draft'){
    Object.assign(e, b);
  } else if(e.status==='published'){
    if(b.description!==undefined) e.description = b.description;
    if(b.registrationDeadline!==undefined) e.registrationDeadline = b.registrationDeadline;
    if(b.registrationLimit!==undefined) e.registrationLimit = b.registrationLimit;
    if(b.tags) e.tags = b.tags;
    if(b.eligibility!==undefined) e.eligibility = b.eligibility;
    if(b.registrationFee!==undefined) e.registrationFee = b.registrationFee;
    if(b.name!==undefined) e.name = b.name;
    if(e.type==='merchandise' && b.items) e.items = b.items;
  } else {
    if(b.description!==undefined) e.description = b.description;
    if(b.tags) e.tags = b.tags;
  }
  await e.save();
  res.json(e);
});

/*10.4*/
router.patch('/:id/status', auth, async function(req,res){
  if(req.user.role!=='organizer') return res.status(403).json({msg:'nope'});
  var e = await Event.findById(req.params.id);
  if(!e || e.organizerId.toString()!==req.user._id.toString()) return res.status(403).json({msg:'nah'});
  var newStatus = req.body.status;
  var allowed = {draft:['published'],published:['ongoing','closed'],ongoing:['completed','closed'],completed:['closed']};
  if(!allowed[e.status] || allowed[e.status].indexOf(newStatus)===-1)
    return res.status(400).json({msg:'invalid status transition'});
  e.status = newStatus;
  await e.save();
  /*10.5*/
  var webhook = req.user.discordWebhook || process.env.DISCORD_WEBHOOK;
  if(newStatus==='published' && webhook){
    try {
      var https = require('https');
      var url = new URL(webhook);
      var payload = JSON.stringify({content:'**New Event:** '+e.name+' - '+e.description});
      var opts = {hostname:url.hostname, path:url.pathname, method:'POST', headers:{'Content-Type':'application/json'}};
      var r = https.request(opts); r.write(payload); r.end();
    } catch(err){}
  }
  res.json(e);
});

module.exports = router;
