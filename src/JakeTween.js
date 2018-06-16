class JakeTween{
	constructor(from,to,time){
		this.lastTimeReset = Date.now();
		this.animationTime = time;
		this.from = from;
		this.to = to;
	}

	getValue(){
		let timeElapsed = Date.now() - this.lastTimeReset;
		let percentComplete = timeElapsed/this.animationTime;
		if(percentComplete>=1){
			percentComplete = 1;
		}
		return this.from+(this.to-this.from)*percentComplete;
	}

	updateTo(from,to){
		this.lastTimeReset = Date.now();
		this.from = from;
		this.to = to;
	}
}