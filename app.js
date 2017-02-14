var express = require('express');
var http 	= require('http');
var path 	= require('path');
var io 		= require('socket.io');
var history=[];
var app 	= express();
app.use(express.static(__dirname + '/'));
var server 	= http.createServer(app);
io = io.listen(server);
server.listen(9000);
io.sockets.on('connection',function(socket){
	console.log('有人連過來了!!');
	//接sockets io myItemMove的訊息
	socket.on('myItemMove',function(data){
		console.log(data);
		//傳送給myItemMove訊息給p1.html
		socket.broadcast.emit('myItemMove',data);
	});
	socket.on('disconnect',function(){
	});
	socket.broadcast.emit('online',history);
});
