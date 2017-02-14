$(function(){
	//設定連線
	var scoket = io.connect();

	var myItem= $('#myItem');
	var position = myItem.position();

	//接收scoket myItemMove傳來的訊息
	scoket.on('myItemMove',function(data){
		var myItem= $('#myItem');
		var position = myItem.position();
		var xNum = data.num
		var myItemx= position.left+(xNum*5);
		$('#myItem').stop().animate({left: myItemx }, 300, function(){});
		checking();
	});

	scoket.on('offline',function(name){
	});
	scoket.on('online',function(){
	});

	//接受訊息後的判定
	function checking(){
		var myItem= $('#myItem');
		var position = myItem.position();
		console.log(position.left);
		if(position.left<　-382){
			$("body").css("background-color", "#84b272");
			$("#winner").html('綠隊獲勝');
		}else if(position.left>400){
			$("body").css("background-color", "#2980b9");
			$("#winner").html('藍隊獲勝');
		}else{
		}
	}
});