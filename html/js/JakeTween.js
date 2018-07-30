class JakeTween{
	constructor(config){
		this.config = {
			on:{},
			to:{},
			time:1000,
			ease: JakeTween.easing.linear,
			yoyo:false,
			loop:false,
			neverDestroy:false,
			onComplete:function(){},
			scope:null
		};
		Object.assign(this.config,config);
		if(this.config.scope === null) {
			this.config.scope = this.config.on;
		}
		this.id = JakeTween.getNextId();
		this.startValues = {};
		JakeTween.tweens[this.id] = this;
		this.started = false;
		this.destroyMe = false;
		return this;
	}

	setConfig(config){
		Object.assign(this.config,config);
		return this
	}

	start(){
		this.started = true;
		this.lastTimeReset = Date.now();
		for(let key in this.config.to){
			this.startValues[key] = this.config.on[key];
		}
		return this;
	}

	stop(){
		this.started = false;
	}

	destroy(){
		this.destroyMe = true;
	}

	update(){
		if(this.destroyMe && !this.config.neverDestroy){
			return false;
		}
		if(!this.started){
			return true;
		}
		let timeElapsed = Date.now() - this.lastTimeReset;
		let percentComplete = timeElapsed/this.config.time;
		let tweenComplete = false;
		if(percentComplete>=1){
			percentComplete = 1;
			tweenComplete = true;
		}
		percentComplete = this.config.ease.call(this,percentComplete);
		for(let key in this.config.to){
			this.config.on[key] = this.startValues[key]+(this.config.to[key]-this.startValues[key])*percentComplete;
		}
		if(tweenComplete){
			if(this.config.yoyo){
				for(let key in this.startValues){
					this.config.to[key] = this.startValues[key];
				}
				this.start();
				return true;
			}else if(this.config.loop){
				for(let key in this.startValues){
					this.config.on[key] = this.startValues[key];
				}
				this.start();
				return true;
			}else if(this.config.neverDestroy){
				return true;
			}else{
				this.config.onComplete.call(this.config.scope);
				return false;
			}
		}
		return true;
	}

	updateTo(from,to){
		this.lastTimeReset = Date.now();
		this.config.from = from;
		this.config.to = to;
	}
}

JakeTween.tweens = [];
JakeTween.tweenCounter = 0;
JakeTween.easing = {
	linear:function(t){
		return t;
	},
	quadratic: {
		in: function (t) {
			return t * t;
		},
		out: function (t) {
			return t * (2 - t);
		},
		inOut: function (t) {
			if ((t *= 2) < 1) {
				return 0.5 * t * t;
			}
			return - 0.5 * (--t * (t - 2) - 1);
		}
	},
	back:{
		out:function(t){
			let s = 1.70158;
			return --t*t*((s+1)*t+s)+1;
		}
	}
};
JakeTween.getNextId = function(){
	return JakeTween.tweenCounter++;
};
JakeTween.update = function(){
	//console.log(JakeTween.tweens.length);
	let ids = Object.keys(JakeTween.tweens);
	for(let i=0;i<ids.length;i++){
		if(!JakeTween.tweens[ids[i]].update()){
			delete JakeTween.tweens[ids[i]];
		}
	}
};