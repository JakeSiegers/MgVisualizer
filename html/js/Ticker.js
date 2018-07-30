class Ticker{
	constructor(canvas){
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
		this.scale = 0;
		this.width = 550;
		this.height = 60;
		this.frame = new PathDrawer({
			ctx:this.ctx,
			points:this.generatePath(),
			fill:true,
			drawX: this.canvas.width/2,
			drawY: this.canvas.height/2+225,
			lineWidth:2
		});
		this.primaryTextYPosition = this.canvas.height/2+215;
		this.primaryText = 'McLeodGaming @ Smash Con 2018';
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

	setText(text){
		this.primaryText = text;
	}

	setSong(song){
		this.song = song;
		if(this.primaryTextYTween){
			this.primaryTextYTween.destroy();
		}
		let newY = this.canvas.height/2+225;
		if(this.song.length > 0){
			newY = this.canvas.height/2+215
		}
		this.primaryTextYTween = new JakeTween({
			on:this,
			to:{primaryTextYPosition:newY},
			time:500,
			ease:JakeTween.easing.quadratic.out,
		}).start();
	}

	show(){
		if(this.hideTween){
			this.hideTween.destroy();
		}
		this.showTween = new JakeTween({
			on:this,
			to:{scale:1},
			time:2000,
			ease:JakeTween.easing.back.out
		}).start();
	}

	hide(){
		if(this.showTween){
			this.showTween.destroy();
		}
		this.hideTween = new JakeTween({
			on:this,
			to:{scale:0},
			time:2000,
			ease:JakeTween.easing.quadratic.out
		}).start();
	}

	draw(){
		this.ctx.save();
		this.frame.setConfigs({
			color:'rgba(0,0,0,0.5)',
			fill:true,
			//angle:-Math.sin(piTimer)*(Math.PI/64),
			scale:this.scale
		}).draw();
		this.frame.setConfigs({
			color:'rgba(255,255,255,0.5)',
			fill:false
		}).draw();
		this.ctx.clip();

		this.ctx.fillStyle = 'rgb(255,255,255)';
		this.ctx.textAlign = 'center';
		this.ctx.textBaseline="middle";
		//this.ctx.globalCompositeOperation = "destination-out";
		let spacer = "      ";
		let text = this.primaryText;
		let textWithSpacer = text+spacer;
		let songText =  'Song Name: '+this.song;
		let songTextWithSpacer = songText+spacer;
		//this.ctx.fillText(text, this.canvas.width/2,this.canvas.height/2+215);

		//this.ctx.fillText(songText, this.canvas.width/2,this.canvas.height/2+242);

		this.ctx.font = 'bold 30px Arial';
		if(this.ctx.measureText(text).width > this.width){
			this.ctx.textAlign = 'left';
			this.ctx.fillText(textWithSpacer+textWithSpacer,this.canvas.width/2-(this.width/2)-(this.ctx.measureText(textWithSpacer).width*this.scrollPosition),this.primaryTextYPosition);
		}else {
			this.ctx.textAlign = 'center';
			this.ctx.fillText(text, this.canvas.width/2, this.primaryTextYPosition);
		}

		if(this.song.length > 0) {
			this.ctx.font = 'bold 18px Arial';
			if (this.ctx.measureText(songText).width > this.width) {
				this.ctx.textAlign = 'left';
				this.ctx.fillText(songTextWithSpacer + songTextWithSpacer, this.canvas.width / 2 - (this.width / 2) - (this.ctx.measureText(songTextWithSpacer).width * this.scrollPosition), this.canvas.height / 2 + 242);
			} else {
				this.ctx.textAlign = 'center';
				this.ctx.fillText(songText, this.canvas.width / 2, this.canvas.height / 2 + 242);
			}
		}
		this.ctx.restore();
	}
}