class MiniTicker{
	constructor(canvas,fist){
		this.fist = fist;
		this.canvas = canvas;
		this.ctx = this.canvas.getContext('2d');
		this.song = '';
		this.scrollPosition = 0;
		this.scrollTween = new JakeTween({
			on:this,
			to:{scrollPosition:1},
			time:10000,
			ease:JakeTween.easing.linear,
			loop:true,
			neverDestroy:true
		}).start();
		this.width = 300;
		this.height = 60;
		this.offScreenPosition = this.canvas.width/2-1000;
		this.onScreenPosition = this.canvas.width/2-490;
		this.x = this.offScreenPosition;
		this.y = this.canvas.height/2-300;
		this.frame = new PathDrawer({
			ctx:this.ctx,
			points:this.generatePath(),
			fill:true,
			drawX: this.x,
			drawY: this.y,
			lineWidth:2
		});
		this.primaryTextYPosition = this.y;
		this.primaryText = 'McLeodGaming @ Smash Con 2018';
		this.showing = false;

		this.notificationYPosition = this.y+this.height;
		this.notificationText = '';
		this.notification = null;

		this.mgBorder = new PathDrawer({
			drawX:this.x+this.width/2,
			drawY:this.y,
			points:[
				{x:678,y:290.8},
				{x:728.1,y:256.2},
				{x:742.3,y:309.4},
				{x:797.1,y:314.2},
				{x:773.8,y:364},
				{x:812.7,y:402.9},
				{x:762.9,y:426.1},
				{x:767.7,y:480.9},
				{x:714.5,y:466.7},
				{x:683,y:511.8},
				{x:651.5,y:466.7},
				{x:598.3,y:480.9},
				{x:603.1,y:426.1},
				{x:553.3,y:402.9},
				{x:592.2,y:364},
				{x:568.9,y:314.2},
				{x:623.7,y:309.4},
				{x:637.9,y:256.2},
				{x:688,y:290.8}
			],
			ctx:this.ctx,
			scale:0.4,
			lineWidth:6,
			angle:Math.PI
		});
	}

	setText(text){
		this.primaryText = text;
	}

	show(){
		this.notification.miniTickerMode = true;
		if(this.hideTween){
			this.hideTween.destroy();
		}
		this.showing = true;
		this.showTween = new JakeTween({
			on:this,
			to:{x:this.onScreenPosition},
			time:500,
			ease:JakeTween.easing.exponential.out,
			onComplete:function(){
			}
		}).start();
	}

	hide(){
		this.notification.miniTickerMode = false;
		if(this.showTween){
			this.showTween.destroy();
		}
		this.hideTween = new JakeTween({
			on:this,
			to:{x:this.offScreenPosition},
			time:500,
			ease:JakeTween.easing.exponential.out,
			onComplete:function(){
				this.showing = false;
			}
		}).start();
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

	displayNotification(message){
		this.notificationText = message.text;
		this.notificationPosition = 0;
		new JakeTween({
			on:this,
			to:{notificationYPosition:this.y+this.height/4,primaryTextYPosition:this.y-this.height/5},
			time:500,
			ease:JakeTween.easing.exponential.out,
			onComplete:function(){
				setTimeout(function(){
					this.hideNotification();
				}.bind(this),message.time);
			}
		}).start();
	}

	hideNotification(){
		new JakeTween({
			on:this,
			to:{notificationYPosition:this.y+this.height,primaryTextYPosition:this.y},
			time:500,
			ease:JakeTween.easing.exponential.out,
			onComplete:function(){
				this.notification.notificationActive = false;
				if(this.notification.notificationQueue.length > 0){
					this.notification.processQueue();
				}
			}
		}).start();
	}

	draw(){
		if(!this.showing){
			return;
		}
		this.ctx.save();
		this.frame.setConfigs({
			color:'rgba(0,0,0,0.5)',
			drawX:this.x,
			fill:true,
		}).draw();
		this.frame.setConfigs({
			color:'rgba(255,255,255,0.5)',
			drawX:this.x,
			fill:false
		}).draw();
		this.ctx.clip();

		let spacer = "   ";
		let text = this.primaryText;
		let textWithSpacer = text+spacer;
		this.ctx.fillStyle = 'rgb(255,255,255)';
		this.ctx.textBaseline= 'middle';

		this.ctx.font = '900 25px Roboto';
		if(this.ctx.measureText(text).width > this.width){
			this.ctx.textAlign = 'left';
			this.ctx.fillText(textWithSpacer+textWithSpacer,this.x-(this.width/2)-(this.ctx.measureText(textWithSpacer).width*this.scrollPosition),this.primaryTextYPosition);
		}else {
			this.ctx.textAlign = 'center';
			this.ctx.fillText(text, this.x, this.primaryTextYPosition);
		}

		let notificationTextWithSpacer = this.notificationText+spacer;

		this.ctx.font = '400 18px Roboto';
		if (this.ctx.measureText(this.notificationText).width > this.width) {
			this.ctx.textAlign = 'left';
			this.ctx.fillText(notificationTextWithSpacer + notificationTextWithSpacer, this.x - (this.width / 2) - (this.ctx.measureText(notificationTextWithSpacer).width * this.scrollPosition), this.notificationYPosition);
		} else {
			this.ctx.textAlign = 'center';
			this.ctx.fillText(this.notificationText, this.x, this.notificationYPosition);
		}

		this.ctx.restore();
		this.mgBorder.setConfigs({
			color:'rgb(0,0,0)',
			drawX:this.x+this.width/2+30,
			fill:true
		}).draw();
		this.mgBorder.setConfigs({
			color:'rgb(255,255,255)',
			fill:false
		}).draw();

		let logoWidth = 150*0.4;
		let logoHeight = 140*0.4;
		this.ctx.drawImage(this.fist,(this.x+this.width/2+30)-logoWidth/2,this.y-logoHeight/2,logoWidth,logoHeight);
	}
}