class Ticker{
	constructor(canvas){
		this.canvas = canvas;
		this.ctx = this.canvas.getContext('2d');
		this.song = '';
		this.scrollTween = new JakeTween({
			from:0,
			to:1,
			animTime:10000,
			easeFn:JakeTween.easing.linear
		}).start();
		this.showTween = new JakeTween({
			from:0,
			to:1,
			animTime:1000,
			easeFn:JakeTween.easing.back.out
		});
		this.frame = new PathDrawer({
			ctx:this.ctx,
			points:[
				{x:30,y:0},
				{x:0,y:30},
				{x:30,y:60},
				{x:560,y:60},
				{x:590,y:30},
				{x:560,y:0},
				{x:30,y:0}
			],
			fill:true,
			drawX: this.canvas.width/2,
			drawY: this.canvas.height/2+225,
			lineWidth:2
		});
	}

	setSong(song){
		this.song = song;
	}

	show(){
		this.showTween.start();
	}

	draw(){
		let scrollDistance = this.scrollTween.getValue();
		if(scrollDistance === 1){
			this.scrollTween.updateTo(0,1);
		}
		let showScale = this.showTween.getValue();
		this.ctx.save();
		this.frame.setConfigs({
			color:'rgba(0,0,0,0.5)',
			fill:true,
			//angle:-Math.sin(piTimer)*(Math.PI/64),
			scale:showScale
		}).draw();
		this.frame.setConfigs({
			color:'rgba(255,255,255,0.5)',
			fill:false
		}).draw();
		this.ctx.clip();
		this.ctx.font = 'bold 30px Arial';
		this.ctx.fillStyle = 'rgb(255,255,255)';
		this.ctx.textAlign = 'left';
		this.ctx.textBaseline="middle";
		//this.ctx.globalCompositeOperation = "destination-out";
		let text = 'McLeodGaming @ Smash Con 2018 - Song Name: '+this.song+'   ';

		this.ctx.fillText(text + text, this.canvas.width/2-265-(this.ctx.measureText(text).width*scrollDistance),this.canvas.height/2+225);
		//this.ctx.font = '20px Arial';
		//this.ctx.fillText(this.song, this.canvas.width/2, this.canvas.height/2+250);
		this.ctx.restore();
	}
}