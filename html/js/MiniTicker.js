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
		this.height = 50;
		this.offScreenPosition = this.canvas.width/2-1000;
		this.onScreenPosition = this.canvas.width/2-490;
		this.x = this.offScreenPosition;
		this.y = this.canvas.height/2-315;
		this.frame = new PathDrawer({
			ctx:this.ctx,
			points:this.generatePath(),
			color:'rgba(0,0,0,0.5)',
			strokeColor:'rgba(255,255,255,0.5)',
			fill:true,
			stroke:true,
			drawX: this.x,
			drawY: this.y,
			lineWidth:2
		});
		this.primaryTextYPosition = this.y;
		this.primaryText = 'SSF2 at Smash Con 2019';
		this.showing = false;

		this.notificationYPosition = this.y+this.height;
		this.notificationText = '';
		this.notification = null;

		this.scale = 0.1;
		this.mgBorder = new PathDrawer({
			color:'rgb(0,0,0)',
			strokeColor:'rgb(255,255,255)',
			drawX:this.x+this.width/2,
			drawY:this.y,
			points:ssf2,
			ctx:this.ctx,
			scale:this.scale,
			lineWidth:1
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
			{x:0,y:0},
			{x:0,y:this.height},
			{x:this.width+tipWidth*1.5,y:this.height},
			{x:this.width+tipWidth*2.7,y:this.height/2},
			{x:this.width+tipWidth*3,y:0},
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
			drawX:this.x,
		}).draw();
		this.ctx.clip();

		let spacer = "   ";
		let text = this.primaryText;
		let textWithSpacer = text+spacer;
		this.ctx.fillStyle = 'rgb(255,255,255)';
		this.ctx.textBaseline= 'middle';

		this.ctx.font = '700 25px "Oswald"';
		if(this.ctx.measureText(text).width > this.width-20){
			this.ctx.textAlign = 'left';
			this.ctx.fillText(textWithSpacer+textWithSpacer,this.x-(this.width/2)-(this.ctx.measureText(textWithSpacer).width*this.scrollPosition),this.primaryTextYPosition);
		}else {
			this.ctx.textAlign = 'center';
			this.ctx.fillText(text, this.x, this.primaryTextYPosition);
		}

		let notificationTextWithSpacer = this.notificationText+spacer;

		this.ctx.font = '400 18px "Oswald"';
		if (this.ctx.measureText(this.notificationText).width > this.width-20) {
			this.ctx.textAlign = 'left';
			this.ctx.fillText(notificationTextWithSpacer + notificationTextWithSpacer, this.x - (this.width / 2) - (this.ctx.measureText(notificationTextWithSpacer).width * this.scrollPosition), this.notificationYPosition);
		} else {
			this.ctx.textAlign = 'center';
			this.ctx.fillText(this.notificationText, this.x, this.notificationYPosition);
		}

		this.ctx.restore();
		this.ctx.save();
		this.mgBorder.setConfigs({
			drawX:this.x+this.width/2+30,
			fill:true,
			stroke:false,
		}).draw();
		this.ctx.clip();

		//Draw fire!
		//this.ctx.fillStyle = 'rgb(0,255,0)';
		//this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);

		this.ctx.restore();
		this.mgBorder.setConfigs({
			fill:false,
			stroke:true,
		}).draw();

	}
}