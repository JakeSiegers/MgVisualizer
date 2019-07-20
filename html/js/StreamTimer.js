class StreamTimer{
	constructor(canvas){
		this.canvas = canvas;
		this.ctx = this.canvas.getContext('2d');
		this.currentTimer = 10000;
		this.startTime = new Date();
		this.hideTimer = true;
		this.timerTweenYPos = 300;
	}

	setTime(time){
		this.hideTimer = false;
		this.currentTimer = time;
		this.startTime = new Date();
		new JakeTween({
			on:this,
			to:{timerTweenYPos:0},
			time:1000,
			ease:JakeTween.easing.exponential.out
		}).start();
	}

	stopTimer(){
		new JakeTween({
			on:this,
			to:{timerTweenYPos:300},
			time:1000,
			ease:JakeTween.easing.exponential.out,
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
		let miliseconds = Math.floor(timeLeft%1000/10);
		if(minutes < 10){
			minutes = "0"+minutes;
		}
		if(seconds < 10){
			seconds = "0"+seconds;
		}
		if(miliseconds < 10){
			miliseconds = "0"+miliseconds;
		}

		this.ctx.save();
		this.ctx.rotate(-0.1);
		this.ctx.font = '40px "Press Start 2P"';
		this.ctx.fillStyle = 'rgb(255,255,255)';
		this.ctx.textBaseline= 'middle';
		this.ctx.textAlign = 'center';
		this.ctx.fillText(minutes+":"+seconds+"."+miliseconds,this.canvas.width-280,this.canvas.height-240+this.timerTweenYPos);
		this.ctx.restore();
	}
}