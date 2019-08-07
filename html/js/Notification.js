class StreamNotification{
	constructor(canvas){
		this.canvas = canvas;
		this.ctx = this.canvas.getContext('2d');
		this.notificationActive = false;
		this.notificationQueue = [];
		this.currentText = 'You should not be reading this!';

		this.miniTickerMode = false;
		this.miniTicker = null;

		this.notificationTweenYPos = -200;
		this.notificationScrollPosition = 0;
		this.notificationScrollTween = new JakeTween({
			on:this,
			to:{notificationScrollPosition:1},
			time:5000,
			ease:JakeTween.easing.linear,
			loop:true,
			neverDestroy:true
		}).start();
	}

	displayNotification(message) {
		this.notificationQueue.push(message);
		this.processQueue();
	}

	processQueue(){
		if(this.notificationActive){
			return;
		}
		let message = this.notificationQueue.shift();
		this.notificationActive = true;
		this.currentText = message.text;
		if(this.miniTickerMode){
			this.miniTicker.displayNotification(message);
			return;
		}

		new JakeTween({
			on:this,
			to:{notificationTweenYPos:0},
			time:1000,
			ease:JakeTween.easing.exponential.out,
			onComplete:function(){
				setTimeout(this.hideNotification.bind(this),message.time)
			}
		}).start();
	}

	hideNotification(){
		new JakeTween({
			on:this,
			to:{notificationTweenYPos:-200},
			time:1000,
			ease:JakeTween.easing.exponential.out,
			onComplete:function(){
				this.notificationActive = false;
				if(this.notificationQueue.length > 0){
					this.processQueue();
				}
			}
		}).start();
	}

	draw(){
		if(!this.notificationActive) {
			return;
		}

		this.ctx.save();
		this.ctx.rotate(-0.1);
		this.ctx.font = '400 50px Oswald';
		this.ctx.fillStyle = 'rgb(255,255,255)';
		this.ctx.textBaseline= 'middle';
		let notificationText = '';
		let notificationTextLength = this.ctx.measureText(this.currentText).width;
		this.notificationScrollTween.setConfig({time:10000+10*notificationTextLength});
		let notificationTextCount = 0;
		while(notificationTextLength < this.canvas.width*3  || notificationTextCount < 2) {
			notificationTextCount++;
			notificationText += this.currentText+'    ';
			notificationTextLength = this.ctx.measureText(notificationText).width;
		}
		this.ctx.fillText(notificationText, -100-notificationTextLength/notificationTextCount*this.notificationScrollPosition, 400+this.notificationTweenYPos);
		this.ctx.restore();
	}
}