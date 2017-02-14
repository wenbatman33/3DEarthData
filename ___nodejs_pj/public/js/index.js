$(function(){
	//console.log('hello');
	//console.log(io);
	var scoket = io.connect();
	scoket.on('getHistory',function(data){
		$.each( data, function( key, value ) {
		  $('#chatroom').prepend('<p> <span class=\'hstory\'>[ 歷史訊息'+value.myTime+' ] </span>'+value.name+' : '+value.message+'</p>');
		});
	});
	$('#name').keydown(function(e) {
	    if (e.keyCode == 13) {
	    	if ($('#name').val() != ''){
				$('#formNamebutton').click();
	    	}else{
	    		alert('請輸入暱稱');
	    	}
		}
	});
	$('#formNamebutton').click(function(){
				$('#name').hide();
		        $('#formNamebutton').hide();
		        $('#input').show();
		        $('#formInputbutton').show();
				$("#input").focus();
				$("#sendBox").css("background-color", "#84b272");

	});
	$('#input').keydown(function(e) {
	    if (e.keyCode == 13) {
		    if ($('#input').val() != ''){
		        $('#formInputbutton').click();
			}else{
				alert('請輸入留言');
			}
		}
	});
	$('#formInputbutton').click(function(){
		//console.log('click');
		var message = $('#input').val();
		var name 	= $('#name').val();
		var myDate = new Date();
		var outHour = myDate.getHours();
		if (outHour >12){newHour = outHour-12;outHour = newHour;}
		if(outHour<10){outHour="0"+outHour;}
		else{outHour=outHour;}

		var outMin = myDate.getMinutes();
		if(outMin<10){outMin="0"+outMin;}
		else{outMin=outMin;}

		var outSec = myDate.getSeconds();
		if(outSec<10){outSec="0"+outSec;}
		else{outSec=outSec;}

		var myTime = outHour + ':' + outMin + ':' + outSec;

		$( "#input" ).val('')
		//console.log(message);

		$('#chatroom').prepend('<p>'+'['+myTime+'] '+name+' : '+message+'</p>');
			scoket.emit('message',{
				name:name,
				message:message,
				myTime:myTime
			});
	});
	scoket.on('message',function(data){
		//$('#chatroom').append('<p>'+data+'</p>')
		$('#chatroom').prepend('<p>'+'['+data.myTime+'] '+data.name+' : '+data.message+'</p>');
	});
	scoket.on('offline',function(name){
		//$('#chatroom').append('<p>'+data+'</p>');
		$('#chatroom').prepend('<p>'+name+' 離線了～</p>');
	});
	scoket.on('online',function(){
		//$('#chatroom').append('<p>'+data+'</p>');
		$('#chatroom').prepend('<p>有人上線了</p>');
	});
});