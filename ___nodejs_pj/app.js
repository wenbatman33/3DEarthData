//基本的express js 設定
var express = require('express');
var app 		= express();
var http 	= require('http');
var path 	= require('path');
app.use(express.static(__dirname + '/public'));
//聊天室的歷史訊息存放
var history=[];

//設定socket.io
var io 		= require('socket.io');
var server 	= http.createServer(app);
io = io.listen(server);
server.listen(3000);

io.sockets.on('connection',function(socket){
	
	socket.emit('getHistory',history);
	var name;

	socket.on('message',function(data){
		name= data.name;
		var obj = {
                    name: data.name,
                    message: data.message,
                    myTime: data.myTime
        }
		history.push(obj);
        history = history.slice(-100);
        
		console.log(history);
		socket.broadcast.emit('message',data);
	});
	//接收訊息function
	socket.on('disconnect',function(){
		//console.log(data);
		socket.broadcast.emit('offline',name);
	});
	
	//中斷連線的function
	socket.on('disconnect',function(){
		//console.log(data);
		socket.broadcast.emit('offline',name);
	});
	

	//發送歷史訊息的function
	socket.broadcast.emit('online',history);


});