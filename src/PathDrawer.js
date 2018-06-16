class PathDrawer{
	constructor(points){
		this.points = points;
		let minX = Number.MAX_VALUE;
		let maxX = Number.MIN_VALUE;
		let minY = Number.MAX_VALUE;
		let maxY = Number.MIN_VALUE;
		for(let i in this.points){
			if(this.points[i].x < minX){
				minX = this.points[i].x
			}
			if(this.points[i].x > maxX){
				maxX = this.points[i].x
			}
			if(this.points[i].y < minY){
				minY = this.points[i].y
			}
			if(this.points[i].y > maxY){
				maxY = this.points[i].y
			}
		}
		this.fromCenter = [];
		this.realCenter = {x:Math.floor((maxX+minX)/2),y:Math.floor((maxY+minY)/2)};
		console.log(this.realCenter);
		for(let i in this.points){
			this.fromCenter.push({
				x: Math.floor(this.realCenter.x - this.points[i].x),
				y: Math.floor(this.realCenter.y - this.points[i].y)
			});
		}
		console.log(this.fromCenter);
	}

	draw(ctx,drawX,drawY,scale,color,angle,fill){
		ctx.beginPath();
		for(let i in this.points){
			let x = this.fromCenter[i].x*scale;
			let y = this.fromCenter[i].y*scale;
			let rx = drawX+(Math.cos(angle) * x) - (Math.sin(angle) * y);
			let ry = drawY+(Math.cos(angle) * y) + (Math.sin(angle) * x);
			//console.log(rx);
			if(i === 0){
				ctx.moveTo(rx,ry);
			}else{
				ctx.lineTo(rx,ry);
			}
		}
		if(fill){
			ctx.fillStyle = color;
			ctx.fill();
		}else{
			ctx.strokeStyle = color;
			ctx.lineWidth=20;
			ctx.stroke();
		}
	}
}