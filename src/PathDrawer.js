class PathDrawer{
	constructor(configs){
		this.configs = {
			ctx: null,
			color: 'rgb(255,0,0)',
			scale: 1,
			angle: 0,
			fill: false,
			drawX: 0,
			drawY: 0,
			points: [{x:0,y:0},{x:0,y:100},{x:100,y:100},{x:100,y:0},{x:0,y:0}],
			lineWidth:20
		};
		this.setConfigs(configs);
	}

	setConfigs(configs){
		Object.assign(this.configs,configs);
		this.updatePoints();
		return this;
	}

	updatePoints(){
		let minX = Number.MAX_VALUE;
		let maxX = Number.MIN_VALUE;
		let minY = Number.MAX_VALUE;
		let maxY = Number.MIN_VALUE;
		for(let i in this.configs.points){
			if(this.configs.points[i].x < minX){
				minX = this.configs.points[i].x
			}
			if(this.configs.points[i].x > maxX){
				maxX = this.configs.points[i].x
			}
			if(this.configs.points[i].y < minY){
				minY = this.configs.points[i].y
			}
			if(this.configs.points[i].y > maxY){
				maxY = this.configs.points[i].y
			}
		}
		this.fromCenter = [];
		this.realCenter = {x:Math.floor((maxX+minX)/2),y:Math.floor((maxY+minY)/2)};
		for(let i in this.configs.points){
			this.fromCenter.push({
				x: Math.floor(this.realCenter.x - this.configs.points[i].x),
				y: Math.floor(this.realCenter.y - this.configs.points[i].y)
			});
		}
	}

	draw(){
		this.configs.ctx.beginPath();
		for(let i in this.configs.points){
			let x = this.fromCenter[i].x*this.configs.scale;
			let y = this.fromCenter[i].y*this.configs.scale;
			let rx = this.configs.drawX+(Math.cos(this.configs.angle) * x) - (Math.sin(this.configs.angle) * y);
			let ry = this.configs.drawY+(Math.cos(this.configs.angle) * y) + (Math.sin(this.configs.angle) * x);
			if(i === 0){
				this.configs.ctx.moveTo(rx,ry);
			}else{
				this.configs.ctx.lineTo(rx,ry);
			}
		}
		if(this.configs.fill){
			this.configs.ctx.fillStyle = this.configs.color;
			this.configs.ctx.fill();
		}else{
			this.configs.ctx.strokeStyle = this.configs.color;
			this.configs.ctx.lineWidth=this.configs.lineWidth;
			this.configs.ctx.stroke();
		}
	}
}