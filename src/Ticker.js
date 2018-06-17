class Ticker{
	constructor(canvas){
		this.canvas = canvas;
		this.ctx = this.canvas.getContext('2d');
		this.song = '';
		this.piTween = new JakeTween(0,Math.PI*2,5000);
		this.frame = new PathDrawer({
			ctx:this.ctx,
			points:[
				{x:30,y:0},
				{x:0,y:35},
				{x:30,y:70},
				{x:560,y:70},
				{x:590,y:35},
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

	draw(){
		let piTimer = this.piTween.getValue();
		if(piTimer === Math.PI*2){
			this.piTween.updateTo(0,Math.PI*2);
		}
		this.frame.setConfigs({
			color:'rgba(0,0,0,0.5)',
			fill:true,
			angle:-Math.sin(piTimer)*(Math.PI/64)
		}).draw();
		this.frame.setConfigs({
			color:'rgb(255,255,255)',
			fill:false
		}).draw();
		this.ctx.font = '40px Arial';
		this.ctx.fillStyle = 'rgb(255,255,255)';
		this.ctx.textAlign = 'center';
		this.ctx.fillText('MG At SmashCon 2018', this.canvas.width/2,this.canvas.height/2+230);
		this.ctx.font = '20px Arial';
		this.ctx.fillText(this.song, this.canvas.width/2, this.canvas.height/2+250);
	}
}