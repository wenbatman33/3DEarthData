//基本的express js 設定

var express = require('express');
var app  	= express();

//設定伺服器port
app.listen(3000);


//開啟後網頁的回應
app.get('/', function(req, res){
  res.send('hello world');
});


//app.use(express.static(__dirname + '/public'));