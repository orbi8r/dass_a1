var express = require('express');
var mongoose= require('mongoose');
var cors = require('cors');
var http= require('http');
var {Server} = require('socket.io');
var path= require('path');
var fs = require('fs');
require('dotenv').config();
require('express-async-errors');

var uploadsDir = path.join(__dirname,'uploads');
if(!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

var app= express();
var server = http.createServer(app);
var io = new Server(server, {cors:{origin:'*'}});

app.use(cors());
app.use(express.json({limit:'50mb'}));
app.use('/uploads', express.static(path.join(__dirname,'uploads')));

if(!process.env.MONGO_URI){ process.exit(1); }
mongoose.connect(process.env.MONGO_URI);

/*4.1*/
app.use('/api/auth', require('./routes/auth'));
/*9.3*/
app.use('/api/events',require('./routes/events'));
/*9*/
app.use('/api/participant', require('./routes/participant'));
/*10*/
app.use('/api/organizer', require('./routes/organizer'));
/*11*/
app.use('/api/admin', require('./routes/admin'));
/*13.1.1*/
app.use('/api/teams', require('./routes/teams'));
/*13.2.1*/
app.use('/api/forum', require('./routes/forum'));
/*13.3.1*/
app.use('/api/feedback',require('./routes/feedback'));

app.use(function(err,req,res,next){
  res.status(500).json({msg:err.message||'server error'});
});


/*13.2.1*/
io.on('connection', function(socket){
   socket.on('joinEvent', function(eid){  socket.join('evt_'+eid); });
  socket.on('leaveEvent', function(eid){ socket.leave('evt_'+eid); });
});
app.set('io', io);

process.on('unhandledRejection', function(){});
var PORT= process.env.PORT || 5000;
server.listen(PORT);
