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
			ease:JakeTween.easing.quadratic.inOut,
			loop:true
		}).start();
		this.scale = 0;
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
		new JakeTween({
			on:this,
			to:{scale:1},
			time:2000,
			ease:JakeTween.easing.back.out
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
		this.ctx.font = 'bold 30px Arial';
		this.ctx.fillStyle = 'rgb(255,255,255)';
		this.ctx.textAlign = 'left';
		this.ctx.textBaseline="middle";
		//this.ctx.globalCompositeOperation = "destination-out";
		let text = 'McLeodGaming @ Smash Con 2018 - Song Name: '+this.song+'   ';

		this.ctx.fillText(text + text, this.canvas.width/2-265-(this.ctx.measureText(text).width*this.scrollPosition),this.canvas.height/2+225);
		//this.ctx.font = '20px Arial';
		//this.ctx.fillText(this.song, this.canvas.width/2, this.canvas.height/2+250);
		this.ctx.restore();
	}
}