class Ticker{
	constructor(canvas){
		this.canvas = canvas;
		this.ctx = this.canvas.getContext('2d');
		this.song = '';
		this.displaySong = '';
		this.scrollPosition = 0;
		this.musicScrollPosition = 0;

		this.tickerTweenYPos = 0;
		this.musicTickerTweenYPos = 300;

		this.scrollTween = new JakeTween({
			on:this,
			to:{scrollPosition:1},
			time:5000,
			ease:JakeTween.easing.linear,
			loop:true,
			neverDestroy:true
		}).start();
		this.musicScrollTween = new JakeTween({
			on:this,
			to:{musicScrollPosition:1},
			time:5000,
			ease:JakeTween.easing.linear,
			loop:true,
			neverDestroy:true
		}).start();
		this.scale = 1;
		this.width = 1000;
		this.height = 200;
		this.frame = new PathDrawer({
			ctx:this.ctx,
			points:this.generatePath(),
			fill:true,
			drawX: this.canvas.width/2,
			drawY: this.canvas.height/2+225,
			lineWidth:2
		});
		this.primaryText = 'SSF2 at Smash Con 2019';
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
		if(this.musicTextTween){
			this.musicTextTween.destroy();
		}
		let newMusicPos = 300;
		let ease = JakeTween.easing.back.in;
		if(song.length > 0){
			newMusicPos = 0;
			ease = JakeTween.easing.back.out;
			this.displaySong = this.song;

		}
		this.musicTextTween = new JakeTween({
			on:this,
			to:{musicTickerTweenYPos:newMusicPos},
			time:1000,
			ease:ease,
			onComplete:function(){
				if(this.song === ''){
					this.displaySong = '';
				}
			}
		}).start();
	}

	show(){
		if(this.hideTween){
			this.hideTween.destroy();
		}
		this.showTween = new JakeTween({
			on:this,
			to:{tickerTweenYPos:0,musicTickerTweenYPos:0},
			time:1000,
			ease:JakeTween.easing.back.out
		}).start();
	}

	hide(){
		if(this.showTween){
			this.showTween.destroy();
		}
		this.hideTween = new JakeTween({
			on:this,
			to:{tickerTweenYPos:300,musicTickerTweenYPos:300},
			time:1000,
			ease:JakeTween.easing.back.in
		}).start();
	}

	draw(){
		//this.ctx.save();
		//this.frame.setConfigs({
		//	color:'rgba(0,0,0,0.5)',
		//	strokeColor:'rgba(255,255,255,0.5)',
		//	fill:true,
		//	stroke:true,
		//	//angle:-Math.sin(piTimer)*(Math.PI/64),
		//	scale:this.scale
		//}).draw();
		//this.ctx.clip();

		this.ctx.fillStyle = 'rgb(255,255,255)';
		this.ctx.textAlign = 'center';
		this.ctx.textBaseline="middle";
		//this.ctx.globalCompositeOperation = "destination-out";

		//this.ctx.fillText(text, this.canvas.width/2,this.canvas.height/2+215);

		//this.ctx.fillText(songText, this.canvas.width/2,this.canvas.height/2+242);
		this.ctx.save();
		this.ctx.rotate(-0.1);

		let text = '';
		this.ctx.font = '700 100px Oswald';
		this.ctx.textAlign = 'left';
		let textLength = this.ctx.measureText(this.primaryText).width;
		this.scrollTween.setConfig({time:10000+10*textLength});
		let textCount = 0;
		while(textLength<this.canvas.width*2 || textCount < 2) {
			textCount++;
			text += this.primaryText+'    ';
			textLength = this.ctx.measureText(text).width;
		}

		if(this.tickerTweenYPos < 300) {
			this.ctx.fillText(text, -100 - textLength / textCount * this.scrollPosition, this.canvas.height - 350 + this.tickerTweenYPos);
		}

		if(this.displaySong.length > 0) {
			let songText = '';
			this.ctx.font = '400 40px Oswald';
			this.ctx.textAlign = 'right';
			let songTextLength = this.ctx.measureText(this.displaySong).width;
			this.musicScrollTween.setConfig({time:10000+10*songTextLength});
			let songTextCount = 0;
			while(songTextLength<this.canvas.width*2  || songTextCount < 2) {
				songTextCount++;
				songText += 'Song Name: '+this.displaySong+'    ';
				songTextLength = this.ctx.measureText(songText).width;
			}
			this.ctx.fillText(songText, this.canvas.width+100+songTextLength/songTextCount*this.musicScrollPosition, this.canvas.height-280+this.musicTickerTweenYPos);
		}
		this.ctx.restore();
	}
}