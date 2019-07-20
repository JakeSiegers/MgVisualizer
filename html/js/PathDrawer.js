class PathDrawer{
	constructor(configs){
		this.init = 0;
		this.configs = {
			ctx: null,
			color: 'rgb(255,0,0)',
			strokeColor: 'rgb(255,0,0)',
			scale: 1,
			angle: 0,
			fill: false,
			stroke: true,
			drawX: 0,
			drawY: 0,
			points: [{x:0,y:0},{x:0,y:100},{x:100,y:100},{x:100,y:0},{x:0,y:0}],
			lineWidth:20,
			section:-1
		};
		this.setConfigs(configs);
	}

	setConfigs(configs){
		for(let i in configs){
			//console.log(i);
			this.configs[i] = configs[i];
		}
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
			let obj = {
				x: Math.floor(this.configs.points[i].x-this.realCenter.x),
				y: Math.floor(this.configs.points[i].y-this.realCenter.y),
				cp1x: 0,
				cp1y: 0,
				cp2x: 0,
				cp2y: 0,
				bezier:false
			};
			if(this.configs.points[i].cp1x){
				obj.bezier = true;
				obj.cp1x = Math.floor(this.configs.points[i].cp1x-this.realCenter.x);
				obj.cp1y = Math.floor(this.configs.points[i].cp1y-this.realCenter.y);
				obj.cp2x = Math.floor(this.configs.points[i].cp2x-this.realCenter.x);
				obj.cp2y = Math.floor(this.configs.points[i].cp2y-this.realCenter.y);
			}

			this.fromCenter.push(obj);
		}
	}

	draw(){
		this.configs.ctx.beginPath();
		let start = 0;
		let end = this.fromCenter.length-1;

		if(this.configs.section >= 0){
			if(this.configs.section > 1){
				this.configs.section = 1;
			}
			let max = this.fromCenter.length-1;
			start = 0;
			end = Math.floor(max*this.configs.section);
			if(end > max){
				end = max;
			}
		}

		let first = true;
		for(let i = start;i<= end; i++){
			let cp1x = this.fromCenter[i].cp1x*this.configs.scale;
			let cp1y = this.fromCenter[i].cp1y*this.configs.scale;
			let cp2x = this.fromCenter[i].cp2x*this.configs.scale;
			let cp2y = this.fromCenter[i].cp2y*this.configs.scale;
			let x = this.fromCenter[i].x*this.configs.scale;
			let y = this.fromCenter[i].y*this.configs.scale;

			let rcp1x = this.configs.drawX+(Math.cos(this.configs.angle) * cp1x) - (Math.sin(this.configs.angle) * cp1y);
			let rcp1y = this.configs.drawY+(Math.cos(this.configs.angle) * cp1y) + (Math.sin(this.configs.angle) * cp1x);
			let rcp2x = this.configs.drawX+(Math.cos(this.configs.angle) * cp2x) - (Math.sin(this.configs.angle) * cp2y);
			let rcp2y = this.configs.drawY+(Math.cos(this.configs.angle) * cp2y) + (Math.sin(this.configs.angle) * cp2x);
			let rx = this.configs.drawX+(Math.cos(this.configs.angle) * x) - (Math.sin(this.configs.angle) * y);
			let ry = this.configs.drawY+(Math.cos(this.configs.angle) * y) + (Math.sin(this.configs.angle) * x);

			if(first){
				first = false;
				//console.log('move');
				this.configs.ctx.moveTo(rx,ry);
			}if(this.fromCenter[i].bezier) {
				this.configs.ctx.bezierCurveTo(rcp1x,rcp1y,rcp2x,rcp2y,rx,ry);
			}else{
				//console.log('line');
				this.configs.ctx.lineTo(rx,ry);
			}
		}
		if(this.configs.fill){
			this.configs.ctx.fillStyle = this.configs.color;
			this.configs.ctx.fill();
		}
		if(this.configs.stroke){
			this.configs.ctx.strokeStyle = this.configs.strokeColor;
			this.configs.ctx.lineWidth = this.configs.lineWidth;
			this.configs.ctx.stroke();
		}
	}
}