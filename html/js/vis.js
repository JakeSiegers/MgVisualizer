/*
	Jake's MG Visualizer 2018 - MIT license.
*/

class MgVisualizer{
	constructor(){

		this.sock = null;

		this.sock = new SocketHelper({
			url:document.location.host+'/webSocket?user=stream',
			onMessage:this.socketMessageReceived,
			scope:this
		});
		this.sock.connect();


		this.audioCtx = null;

		this.musicSource = null;
		this.musicAnalyser = null;

		this.beatSource = null;
		this.beatAnalyser = null;

		this.currentBuffer = null;
		this.bufferLength = null;
		this.dataArray = null;
		this.lowPassDataArray = null;

		this.canvas = document.querySelector('.visualizer');
		this.canvasCtx = this.canvas.getContext("2d");
		//this.canvasCtx.fillStyle = 'rgb(0, 0, 0)';
		//this.canvasCtx.fillRect(0, 0, this.canvas.width,  this.canvas.height);

		this.canvasOpacity = 1;

		this.overlayCanvas = document.querySelector('.overlay');
		this.overlayCtx = this.overlayCanvas.getContext("2d");
		//this.overlayCtx.fillStyle = 'rgb(0, 0, 0)';
		//this.overlayCtx.fillRect(0, 0, this.overlayCanvas.width,  this.overlayCanvas.height);

		this.ticker = new Ticker(this.overlayCanvas);
		this.fist = new Image();
		this.fist.src = 'img/fist.png';

		let points = [
			{x:678,y:290.8},
			{x:728.1,y:256.2},
			{x:742.3,y:309.4},
			{x:797.1,y:314.2},
			{x:773.8,y:364},
			{x:812.7,y:402.9},
			{x:762.9,y:426.1},
			{x:767.7,y:480.9},
			{x:714.5,y:466.7},
			{x:683,y:511.8},
			{x:651.5,y:466.7},
			{x:598.3,y:480.9},
			{x:603.1,y:426.1},
			{x:553.3,y:402.9},
			{x:592.2,y:364},
			{x:568.9,y:314.2},
			{x:623.7,y:309.4},
			{x:637.9,y:256.2},
			{x:688,y:290.8}
		];

		this.mgBorder = new PathDrawer({
			points:ssf2,
			ctx:this.overlayCtx,
		});
		this.mgBgBorder = new PathDrawer({
			points:ssf2,
			ctx:this.canvasCtx,
		});


		this.stats = new Stats();
		//document.body.appendChild( this.stats.dom );

		this.audioCtx = new window.AudioContext();

		this.musicQueue = [];
		this.currentSong = 0;
		this.loadingSong = false;
		this.renderVisualizer = false;
		this.stopped = true;
		this.startTime = 0;
		this.pauseTime = 0;
		this.paused = false;
		this.flowIn = false;

		this.mgColors = [
			{r:244,g:67,b:54},
			{r:255,g:255,b:59},
			{r:255,g:255,b:255}
			/*
			{r:243,g:229,b:245},
			{r:225,g:190,b:231},
			{r:206,g:147,b:216},
			{r:186,g:104,b:200},
			{r:171,g: 71,b:188},
			{r:156,g: 39,b:176},
			{r:142,g: 36,b:170},
			{r:123,g: 31,b:162},
			{r:106,g: 27,b:154},
			{r: 74,g: 20,b:140}
			*/
		];

		this.rainbowColors = [
			{r:244,g:67,b:54}, //red
			{r:255,g:87,b:34}, //deep orange
			{r:255,g:152,b:0}, // orange
			{r:155,g:193,b:7}, //amber
			{r:255,g:255,b:59}, //yellow
			{r:139,g:195,b:74}, //light green
			{r:76,g:175,b:80}, //green
			{r:0,g:150,b:136}, //teal
			{r:33,g:150,b:243}, //Blue
			{r:63,g:81,b:181}, //Indigo
			{r:103,g:58,b:183}, //Deep Purple
			{r:156,g:39,b:176} //Purple
		];

		this.vaporwaveColors = [
			{r:255,g:113,b:206},
			{r:1,g:205,b:254},
			{r:5,g:255,b:161},
			{r:185,g:103,b:255},
			{r:255,g:251,b:150}
		];

		this.colors = this.vaporwaveColors;
		this.currentColor = 0;

		this.recentBeatPeaks = [];
		this.beatPeakCap = 1;

		document.onkeypress = this.keypress.bind(this);

		this.trigTimer = 0;
		new JakeTween({
			on:this,
			to:{trigTimer:Math.PI*2},
			time:30000,
			loop:true
		}).start();

		this.logoWallPosition = 0;
		new JakeTween({
			on:this,
			to:{logoWallPosition:1},
			time:30000,
			loop:true
		}).start();

		this.logoScale = 1;
//
		this.logoBeatValSmoothed = this.beatValSmoothed = 0;
		this.beatValTween = new JakeTween({
			on:this,
			to:{beatValSmoothed:0},
			time:100,
			ease:JakeTween.easing.quadratic.out,
			neverDestroy:true
		});

		this.logoX = this.canvas.width/2;
		this.logoY = this.canvas.height/2;
		this.logoAngle = Math.random()*Math.PI*2;

		this.notification = new StreamNotification(this.overlayCanvas);
		this.streamTimer = new StreamTimer(this.overlayCanvas);
		this.miniTicker = new MiniTicker(this.overlayCanvas,this.fist);

		this.miniTicker.notification = this.notification;
		this.notification.miniTicker = this.miniTicker;

		this.currentScene = 'music';

		this.currentSensitivity = 64;

		this.draw();
	}

	socketMessageReceived(message){
		switch(message.action) {
			case 'playSong':
				this.loadSongViaAjax(message.value);
				break;
			case 'play':
				if(this.currentScene !== 'music'){
					return;
				}
				//fade in music, start visuals
				Ajax.request({
					url:'/api/getMusicQueue',
					success:function(reply){
						this.musicQueue = reply.musicQueue;
						this.currentSong = 0;
						this.loadSongViaAjax(this.musicQueue[this.currentSong]);
					},
					scope:this
				});
				break;
			case 'stop':
				this.stop();
				break;
			case 'pause':
				this.pause();
				break;
			case 'notification':
				this.notification.displayNotification(message);
				break;
			case 'setMusicQueue':
				this.musicQueue = message.queue;
				break;
			case 'setTimer':
				this.streamTimer.setTime(message.time);
				break;
			case 'stopTimer':
				this.streamTimer.stopTimer();
				break;
			case 'updateText':
				this.ticker.setText(message.text);
				this.miniTicker.setText(message.text);
				break;
			case 'switchToMusic':
				if(this.loadingSong){
					return;
				}
				this.currentScene = 'music';
				this.miniTicker.hide();
				this.ticker.show();
				new JakeTween({
					on:this,
					to:{logoScale:1},
					time:500,
					ease:JakeTween.easing.exponential.out,
				}).start();
				Ajax.request({
					url:'/api/getMusicQueue',
					success:function(reply){
						this.musicQueue = reply.musicQueue;
						if(this.musicQueue.length > 0){
							this.currentSong = Math.floor(Math.random()*this.musicQueue.length);
							this.loadSongViaAjax(this.musicQueue[this.currentSong]);
						}
					},
					scope:this
				});
				break;
			case 'switchToGame':
				if(this.loadingSong){
					return;
				}
				new JakeTween({
					on:this,
					to:{logoScale:0},
					time:500,
					ease:JakeTween.easing.exponential.out,
				}).start();
				this.currentScene = 'ssf2';
				this.streamTimer.stopTimer();
				this.ticker.hide();
				this.stopMusicAndVisualizer();
				setTimeout(function(){
					this.miniTicker.show();
				}.bind(this),1000);
				break;

			default:
				console.error('Unknown action "'+message.action+'"');
				break;
		}
	}

	keypress(event){
		switch(event.key){
			case 'p':
				this.pause();
				break;
			case 'f':
				this.canvasCtx.fillStyle = 'rgba(0, 0, 0, 1)';
				this.canvasCtx.fillRect(0,0,this.canvas.width,this.canvas.height);
				this.flowIn = !this.flowIn;
				break;
			case 'c':
				this.currentColor = 0;
				if(this.colors === this.mgColors){
					this.colors = this.rainbowColors;
				}else{
					this.colors = this.mgColors;
				}
				break;
		}
	};

	loadSongViaAjax(url){
		if(this.loadingSong || typeof url !== 'string' || url.trim().length === 0){
			return;
		}
		this.loadingSong = true;
		this.stop();
		this.parseFileName(url);
		let xhr = new XMLHttpRequest();
		xhr.responseType = 'arraybuffer';
		xhr.onreadystatechange = function(){
			if(xhr.readyState === XMLHttpRequest.DONE){
				if(xhr.status === 200){
					this.audioCtx.decodeAudioData(xhr.response, function(newBuffer){
						this.currentBuffer = newBuffer;
						this.loadingSong = false;
						this.play();
						this.ticker.show();
					}.bind(this));
				} else{
					alert('something else other than 200 was returned');
				}
			}
		}.bind(this);
		xhr.open("GET", "music/"+url, true);
		xhr.send();
	}

	parseFileName(file) {
		let pattern = /\[s(\d+)]/;
		let matches = file.match(pattern);
		if(matches != null && matches.length >= 2){
			file = file.replace(pattern,"");
			this.currentSensitivity = matches[1];
		}else{
			this.currentSensitivity = 64;
		}
		let dot = file.lastIndexOf('.');
		if(dot !== -1){
			this.ticker.setSong(file.substring(0,dot));
		}else{
			this.ticker.setSong(file);
		}
	}

	play(){
		if(this.stopTimeout){
			this.stopTimeout.destroy();
		}

		let offset = this.pauseTime;
		//beatContext = new window.AudioContext();
		this.beatSource = this.audioCtx.createBufferSource();
		this.beatSource.buffer = this.currentBuffer;
		this.beatSource.loop = false;
		let filter = this.audioCtx.createBiquadFilter();
		filter.type = "lowpass";
		this.beatSource.connect(filter);
		//filter.connect(beatContext.destination);
		this.beatAnalyser = this.audioCtx.createAnalyser();
		filter.connect(this.beatAnalyser);
		this.beatAnalyser.fftSize = 128; //must be power of 2
		//this.beatAnalyser.smoothingTimeConstant = 1;
		this.lowPassDataArray = new Uint8Array(this.beatAnalyser.frequencyBinCount);

		this.musicSource = this.audioCtx.createBufferSource();
		this.musicSource.connect(this.audioCtx.destination);
		this.musicSource.buffer = this.currentBuffer;
		this.musicSource.loop = false;
		this.musicAnalyser = this.audioCtx.createAnalyser();
		this.musicSource.connect(this.musicAnalyser);
		this.musicAnalyser.fftSize = 128; //must be power of 2
		this.musicAnalyser.smoothingTimeConstant = 1;
		this.bufferLength = this.musicAnalyser.frequencyBinCount;
		this.dataArray = new Uint8Array(this.bufferLength);

		this.musicSource.start(0,offset);
		this.beatSource.start(0,offset);
		this.startTime = this.audioCtx.currentTime - offset;
		this.pauseTime = 0;
		this.paused = false;
		this.loadingSong = false;
		this.renderVisualizer = true;
		this.stopped = false;

		new JakeTween({
			on:this,
			to:{canvasOpacity:1},
			ease:JakeTween.easing.quadratic.out,
			time:1000
		}).start();

		this.musicSource.onended = function(){
			if(this.loadingSong || this.stopped){
				return;
			}
			this.currentSong++;
			if(this.currentSong >= this.musicQueue.length){
				this.currentSong = 0;
			}
			this.loadSongViaAjax(this.musicQueue[this.currentSong]);
		}.bind(this);
	}

	pause(){
		if(this.paused){
			this.play();
			this.paused = false;
			return;
		}
		let elapsed = this.audioCtx.currentTime - this.startTime;
		this.stop(true);
		this.pauseTime = elapsed;
		this.paused = true;
	}

	stop(doNotClearTitle){
		this.stopped = true;
		this.paused = false;
		if(this.musicSource){
			//this.musicSource.disconnect();
			this.musicSource.stop();
			//this.musicSource = null;
			//this.beatSource.disconnect();
			this.beatSource.stop();
			//this.beatSource = null;
		}
		this.pauseTime = 0;
		this.startTime = 0;
		if(!doNotClearTitle){
			this.ticker.setSong('');
		}
	}

	stopMusicAndVisualizer(){
		this.stop();
		if(this.stopTimeout){
			this.stopTimeout.destroy();
		}
		this.stopTimeout = new JakeTween({
			on:this,
			to:{canvasOpacity:0},
			ease:JakeTween.easing.quadratic.out,
			time:1000,
			onComplete:function(){
				this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
				this.renderVisualizer = false;
			},
			scope:this
		}).start();
	}

	draw(time) {
		this.stats.begin();
		this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
		JakeTween.update();
		this.drawVisuals();
		this.ticker.draw();
		this.miniTicker.draw();
		this.notification.draw();
		this.streamTimer.draw();
		requestAnimationFrame(this.draw.bind(this));
		this.stats.end();
	}

	drawVisuals(){
		this.canvas.style.opacity = this.canvasOpacity;
		this.canvasCtx.fillStyle = 'rgba(0, 0, 0,0.1)';
		this.canvasCtx.fillRect(0,0,this.canvas.width,this.canvas.height);

		if(this.renderVisualizer){

			//if(this.paused || !this.musicPlaying){
			//	return;
			//}

			this.musicAnalyser.getByteTimeDomainData(this.dataArray);
			this.beatAnalyser.getByteTimeDomainData(this.lowPassDataArray);


			let beatVal = Math.abs(this.lowPassDataArray[0]-128)/this.currentSensitivity;//64;
			if(beatVal >= this.beatPeakCap && !this.recentBeatPeaks.includes(this.beatPeakCap)){
				beatVal = this.beatPeakCap;
				this.currentColor++;
				if(this.currentColor === this.colors.length){
					this.currentColor = 0;
				}
			}
			this.recentBeatPeaks.push(beatVal);
			if(this.recentBeatPeaks.length > 1){
				this.recentBeatPeaks.shift();
			}

			//Tone this down a bit for the logo bouncing.
			//this.logoBeatValSmoothed = this.beatValSmoothed/3;
			this.beatValTween.setConfig({to:{beatValSmoothed:beatVal}}).start();
		}


		let r = Math.floor((this.colors[this.currentColor].r)*this.beatValSmoothed);
		let g = Math.floor((this.colors[this.currentColor].g)*this.beatValSmoothed);
		let b = Math.floor((this.colors[this.currentColor].b)*this.beatValSmoothed);

		let rgb = 'rgb('+r+','+g+','+b+')';

		this.canvasCtx.fillStyle = '#ffffff';

		//this.drawCircle(rgb,this.dataArray);
		for(let x = 0;x<4;x++) {
			for (let y = 0; y < 4; y++) {

				let drawX = ((this.logoX-1000)+(500*x))+(500*this.logoWallPosition);
				let drawY = ((this.logoY-1000)+(600*y))+(600*this.logoWallPosition);
				let angle = 0.1*Math.sin(this.trigTimer);
				let scale = (0.1*Math.sin(this.trigTimer) + 0.5)*this.logoScale;
				let lineWidth = 5 * this.logoScale;

				this.mgBgBorder.setConfigs({
					scale: scale,
					color: rgb,
					strokeColor: rgb,
					angle: angle,
					fill: false,
					stroke: true,
					drawX:drawX,
					drawY:drawY,
					lineWidth:lineWidth
				}).draw();

				//this.overlayCtx.save();
				this.mgBorder.setConfigs({
					scale: scale,
					color: 'rgb(0,0,0)',
					strokeColor: 'rgb(20,20,20)',
					angle: angle,
					fill: true,
					stroke: true,
					drawX:drawX,
					drawY:drawY,
					lineWidth:lineWidth
				}).draw();
				//this.overlayCtx.clip();

				//fire!
				//this.overlayCtx.fillStyle = 'rgb(255,0,255)';
				//this.overlayCtx.fillRect(0,0,this.canvas.width,this.canvas.height);

				//this.overlayCtx.restore();
				//this.mgBorder.setConfigs({
				//	fill: false,
				//	stroke: true,
				//}).draw();

			}
		}


		let fadeSpeed = Math.abs(this.beatValSmoothed)*15+5;
		//fadeSpeed = 15;
		if(this.stopped){
			fadeSpeed = 30;
		}
		//if(this.flowIn){
			this.canvasCtx.drawImage(this.canvasCtx.canvas, 0, 0, this.canvas.width, this.canvas.height, fadeSpeed, fadeSpeed, this.canvas.width - fadeSpeed*2, this.canvas.height - fadeSpeed*2);
		//}else{
			//this.canvasCtx.drawImage(this.canvasCtx.canvas, 0, 0, this.canvas.width, this.canvas.height, -fadeSpeed, -fadeSpeed, this.canvas.width + fadeSpeed*2, this.canvas.height + fadeSpeed*2);
		//}

	}

	drawCircle(color,data){
		this.canvasCtx.strokeStyle = color;
		this.canvasCtx.lineWidth = 8;
		this.canvasCtx.beginPath();
		let circleRadius = 110;
		for(let i = 0; i < this.bufferLength; i++) {
			let spike = data[i] -128;
			let x = this.canvas.width/2 + Math.cos((Math.PI*2)*(i/this.bufferLength)+(Math.PI/2))*(circleRadius+spike);
			let y = this.canvas.height/2 + Math.sin((Math.PI*2)*(i/this.bufferLength)+(Math.PI/2))*(circleRadius+spike);
			if(i === 0) {
				this.canvasCtx.moveTo(x, y);
			} else {
				this.canvasCtx.lineTo(x, y);
			}
		}
		let firstSpike =  (data[0] -128);
		let lastX = this.canvas.width/2 + Math.cos(Math.PI/2)*(circleRadius+firstSpike);
		let lastY = this.canvas.height/2 + Math.sin(Math.PI/2)*(circleRadius+firstSpike);
		this.canvasCtx.lineTo(lastX, lastY);
		this.canvasCtx.stroke();
	}
}