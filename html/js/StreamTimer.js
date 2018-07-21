class StreamTimer{
	constructor(canvas){
		this.canvas = canvas;
		this.ctx = this.canvas.getContext('2d');
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
}