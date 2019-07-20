class StreamNotification{
	constructor(canvas){
		this.canvas = canvas;
		this.ctx = this.canvas.getContext('2d');
		this.notificationActive = false;
		this.notificationQueue = [];
		this.currentText = 'You should not be reading this!';
		this.scale = 0;
		this.width = 480;
		this.height = 30;
		this.miniTickerMode = false;

		this.miniTicker = null;

		this.frame = new PathDrawer({
			ctx:this.ctx,
			points:this.generatePath(),
			fill:true,
			drawX: this.canvas.width/2,
			drawY: this.canvas.height/2-300,
			lineWidth:2,
			scale:this.scale
		});
		this.scrollPosition = 0;
		this.scrollTween = new JakeTween({
			on:this,
			to:{scrollPosition:1},
			time:1000,
			ease:JakeTween.easing.quadratic.inOut,
			loop:true,
			neverDestroy:true
		});
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
		this.scale = 0;
		this.scrollTween.stop();
		this.scrollPosition = 0;
		new JakeTween({
			on:this,
			to:{scale:1},
			time:500,
			ease:JakeTween.easing.exponential.out,
			onComplete:function(){
				this.scrollTween.setConfig({to:{scrollPosition:1},time:message.time/2}).start();
				setTimeout(this.hideNotification.bind(this),message.time)
			}
		}).start();
	}

	hideNotification(){
		new JakeTween({
			on:this,
			to:{scale:0},
			time:500,
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
		if(!this.notificationActive){
			return;
		}
		this.ctx.save();
		this.frame.setConfigs({
			color:'rgba(0,0,0,0.5)',
			strokeColor:'rgba(255,255,255,0.5)',
			scale:this.scale,
			fill:true,
			stroke:true,
		}).draw();
		this.ctx.clip();
		this.ctx.font = '900 20px Roboto';
		this.ctx.fillStyle = 'rgb(255,255,255)';
		this.ctx.textBaseline= 'middle';
		let text = this.currentText;
		let textWithSpacer = this.currentText+"  ";
		if(this.ctx.measureText(text).width > this.width){
			this.ctx.textAlign = 'left';
			this.ctx.fillText(textWithSpacer+textWithSpacer, this.canvas.width/2-(this.width/2)-(this.ctx.measureText(textWithSpacer).width*this.scrollPosition),this.canvas.height/2 - 300);
		}else {
			this.ctx.textAlign = 'center';
			this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2 - 300);
		}
		this.ctx.restore();
	}
}