class JakeTween{
	constructor(config){
		this.conf = {
			from:0,
			to:1,
			animTime:1000,
			easeFn: JakeTween.easing.linear
		};
		Object.assign(this.conf,config);
		return this;
	}

	start(){
		this.started = true;
		this.lastTimeReset = Date.now();
		return this;
	}

	stop(){
		this.started = false;
		return this;
	}

	getValue(){
		if(!this.started){
			return this.conf.from;
		}
		let timeElapsed = Date.now() - this.lastTimeReset;
		let percentComplete = timeElapsed/this.conf.animTime;
		if(percentComplete>=1){
			percentComplete = 1;
		}
		percentComplete = this.conf.easeFn.call(this,percentComplete);
		return this.conf.from+(this.conf.to-this.conf.from)*percentComplete;
	}

	updateTo(from,to){
		this.lastTimeReset = Date.now();
		this.conf.from = from;
		this.conf.to = to;
	}

}

JakeTween.easing = {
	linear:function(t){
		return t;
	},
	quadratic: {
		out:function(t){
			return t * (2 - t);
		}
	},
	back:{
		out:function(t){
			let s = 1.70158;
			return --t*t*((s+1)*t+s)+1;
		}
	}
};