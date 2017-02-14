$(function(){
	//設定連線
	var scoket = io.connect();
	$( "#main" ).on( "swipeleft", swipeleftHandler );
	$( "#main" ).on( "swiperight", swiperightHandler );

 	function swipeleftHandler( event ){
		sendPosition(-3);
		$( "#Tug_l" ).show();
		$( "#Tug_r" ).hide();
	}
	function swiperightHandler( event ){
	   	sendPosition(3);
		$( "#Tug_l" ).hide();
		$( "#Tug_r" ).show();
	}
	//傳送scoket io myItemMove的訊息
	function sendPosition(myNum){
		scoket.emit('myItemMove',{
			num: myNum
		});
	}
});