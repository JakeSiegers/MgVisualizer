class StreamTimer{
	constructor(canvas){
		this.canvas = canvas;
		this.ctx = this.canvas.getContext('2d');
		this.width = 220;
		this.height = 50;
		this.x = this.canvas.width/2;
		this.y = this.canvas.height/2+300;
		this.currentTimer = 10000;
		this.startTime = new Date();
		this.scale = 0;
		this.frame = new PathDrawer({
			ctx:this.ctx,
			points:this.generatePath(),
			fill:true,
			drawX: this.x,
			drawY: this.y,
			lineWidth:2,
			scale:this.scale
		});
		this.hideTimer = true;

	}

	generatePath(){
		let tipWidth = (this.height/2);

		return [
			{x:tipWidth,y:0},
			{x:0,y:this.height/2},
			{x:tipWidth,y:this.height},
			{x:this.width+tipWidth,y:this.height},
			{x:this.width+tipWidth*2,y:this.height/2},
			{x:this.width+tipWidth,y:0},
			{x:tipWidth,y:0}
		]
	}

	setTime(time){
		this.hideTimer = false;
		this.currentTimer = time;
		this.startTime = new Date();
		new JakeTween({
			on:this,
			to:{scale:1},
			time:500,
			ease:JakeTween.easing.quadratic.out
		}).start();
	}

	stopTimer(){
		new JakeTween({
			on:this,
			to:{scale:0},
			time:500,
			ease:JakeTween.easing.quadratic.out,
			onComplete:function(){
				this.hideTimer = true;
			}
		}).start();
	}

	draw(){
		if(this.hideTimer){
			return;
		}
		let now = new Date();
		let difference = now - this.startTime;
		let timeLeft = this.currentTimer - difference;
		if(timeLeft < 0){
			if(timeLeft < -5000){
				this.stopTimer();
			}
			timeLeft = 0;
		}
		let totalSeconds = timeLeft/1000;
		let minutes = Math.floor(totalSeconds/60);
		let seconds = Math.floor(totalSeconds%60);
		let miliseconds = Math.floor(timeLeft%1000);
		if(minutes < 10){
			minutes = "0"+minutes;
		}
		if(seconds < 10){
			seconds = "0"+seconds;
		}
		if(miliseconds < 100){
			miliseconds = "0"+miliseconds;
		}
		if(miliseconds < 10){
			miliseconds = "0"+miliseconds;
		}


		this.ctx.save();
		this.frame.setConfigs({
			color:'rgba(0,0,0,0.5)',
			scale:this.scale,
			fill:true
		}).draw();
		this.frame.setConfigs({
			color:'rgba(255,255,255,0.5)',
			scale:this.scale,
			fill:false,
		}).draw();
		this.ctx.clip();
		this.ctx.font = 'bold 40px Lucida Console';
		this.ctx.fillStyle = 'rgb(255,255,255)';
		this.ctx.textBaseline= 'middle';
		this.ctx.textAlign = 'center';
		this.ctx.fillText(minutes+":"+seconds+"."+miliseconds,this.x,this.y);
		this.ctx.restore();
	}
}