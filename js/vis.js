/*
	Jake's MG Visualizer 2018 - MIT license.
*/

var beatSource;
var beatAnalyser;
var beatBufferLength;

var audioCtx;
var source;
var analyser;
var bufferLength;
var dataArray;
var lowPassDataArray;

var canvas = document.querySelector('.visualizer');
var canvasCtx = canvas.getContext("2d");
canvasCtx.fillStyle = 'rgb(0, 0, 0)';
canvasCtx.fillRect(0, 0, canvas.width,  canvas.height);

var overlayCanvas = document.querySelector('.overlay');
var overlayCanvasCtx = overlayCanvas.getContext("2d");
overlayCanvasCtx.fillStyle = 'rgb(0, 0, 0)';
overlayCanvasCtx.fillRect(0, 0, overlayCanvas.width,  overlayCanvas.height);

let mouseX = overlayCanvas.width/2;
let mouseY = overlayCanvas.height/2;

document.addEventListener('mousemove', function(evt) {
	let rect = overlayCanvas.getBoundingClientRect();
	mouseX = evt.clientX - rect.left;
	mouseY = evt.clientY - rect.top;
}, false);

class PathDrawer{
	constructor(ctx,points){
		this.ctx = ctx;
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

	draw(drawX,drawY,scale,color,angle,fill){
		this.ctx.beginPath();
		for(let i in this.points){
			let x = this.fromCenter[i].x*scale;
			let y = this.fromCenter[i].y*scale;
			let rx = drawX+(Math.cos(angle) * x) - (Math.sin(angle) * y);
			let ry = drawY+(Math.cos(angle) * y) + (Math.sin(angle) * x);
			//console.log(rx);
			if(i === 0){
				this.ctx.moveTo(rx,ry);
			}else{
				this.ctx.lineTo(rx,ry);
			}
		}
		if(fill){
			this.ctx.fillStyle = color;
			this.ctx.fill();
		}else{
			this.ctx.strokeStyle = color;
			this.ctx.lineWidth=20;
			this.ctx.stroke();
		}
	}
}

let points = [
	{x:683,y:287.8},
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
	{x:683,y:287.8}
];

let mgBorder = new PathDrawer(canvasCtx,points);
let mgBorder2 = new PathDrawer(overlayCanvasCtx,points);


var alreadyDrawing = false;

var stats = new Stats();
//document.body.appendChild( stats.dom );

audioCtx = new window.AudioContext();

var musicQueue = [];
var currentSong = 0;
var loadingSong = false;

var startedAt = 0;
var pausedAt = 0;
var paused = false;
var buffer = null;
var flowIn = false;

audio_file.onchange = function() {
	document.getElementById('infoBox').style.display = 'none';
	if(this.files.length > 0){
		musicQueue = this.files;
		currentSong = 0;
		loadSong(musicQueue[0]);
	}
};

document.onkeypress = function(event){
	switch(event.key){
		case 'p':
			pause();
			break;
		case 'f':
			canvasCtx.fillStyle = 'rgba(0, 0, 0, 1)';
			canvasCtx.fillRect(0,0,canvas.width,canvas.height);
			flowIn = !flowIn;
			break;
	}
};

var tickerTimer = null;
var tickerDirectionLeft = true;

function toggleTicker(){
	var tickerText = document.getElementById('tickerText');
	var tickerWrap = document.getElementById('tickerWrap');
	var difference = tickerText.offsetWidth - tickerWrap.offsetWidth;
	//console.log(tickerText.offsetWidth,tickerWrap.offsetWidth);
	//console.log(difference);
	if(difference <= 0){
		tickerText.style.left = (-difference/2)+'px';
		tickerTimer = setTimeout(toggleTicker,10000);
		return;
	}

	if(tickerDirectionLeft){
		tickerText.style.left = -(difference+10)+'px';
	}else{
		tickerText.style.left = '10px';
	}
	tickerDirectionLeft = !tickerDirectionLeft;
	tickerTimer = setTimeout(toggleTicker,10000);
}

function loadSong(file){
	loadingSong = true;
	var tickerText = document.getElementById('tickerText');
	var tickerWrap = document.getElementById('tickerWrap');
	//var tickerPrefix = document.getElementById('tickerPrefix');
	var dot = file.name.lastIndexOf('.');
	if(dot !== -1){
		tickerText.innerHTML = file.name.substring(0,dot);
	}else{
		tickerText.innerHTML = file.name;
	}

	if(tickerTimer !== null){
		clearTimeout(tickerTimer);
	}
	tickerText.style.left = '0px';
	//tickerTimer = setTimeout(toggleTicker,1000);
	toggleTicker();

	stop();
	document.getElementById('text').style.opacity = 0;//0.6;
	tickerWrap.style.opacity = 0;//0.6;
	//tickerPrefix.style.opacity = 0.6;
	var reader = new FileReader();
	reader.onload = function() {
		audioCtx.decodeAudioData(reader.result, function(newBuffer){
			buffer = newBuffer;
			play();
		});
	};
	reader.readAsArrayBuffer(file);
}

function play(){

	var offset = pausedAt;

	//beatContext = new window.AudioContext();
	beatSource = audioCtx.createBufferSource();
	beatSource.buffer = buffer;
	beatSource.loop = false;
	var filter = audioCtx.createBiquadFilter();
	filter.type = "lowpass";
	beatSource.connect(filter);
	//filter.connect(beatContext.destination);
	beatAnalyser = audioCtx.createAnalyser();
	filter.connect(beatAnalyser);
	beatAnalyser.fftSize = 128; //must be power of 2
	//beatAnalyser.smoothingTimeConstant = 1;
	beatBufferLength = beatAnalyser.frequencyBinCount;
	lowPassDataArray = new Uint8Array(beatBufferLength);

	source = audioCtx.createBufferSource();
	source.connect(audioCtx.destination);
	source.buffer = buffer;
	source.loop = false;
	analyser = audioCtx.createAnalyser();
	source.connect(analyser);
	analyser.fftSize = 128; //must be power of 2
	analyser.smoothingTimeConstant = 1;
	bufferLength = analyser.frequencyBinCount;
	dataArray = new Uint8Array(bufferLength);

	source.start(0,offset);
	beatSource.start(0,offset);
	startedAt = audioCtx.currentTime - offset;
	pausedAt = 0;
	paused = false;
	loadingSong = false;

	source.onended = function(){
		if(loadingSong){
			return;
		}
		currentSong++;
		if(currentSong >= musicQueue.length){
			//NO Playlist looping for now!
			//currentSong = 0;
		}else {
			loadSong(musicQueue[currentSong]);
		}
	};

	if(!alreadyDrawing){
		alreadyDrawing = true;
		draw();
	}
}

function pause(){
	if(paused){
		play();
		requestAnimationFrame(draw);
		return;
	}
	var elapsed = audioCtx.currentTime - startedAt;
	stop();
	pausedAt = elapsed;
	paused = true;
}

function stop(){
	paused = false;
	if(source){
		source.disconnect();
		source.stop();
		source = null;
		beatSource.disconnect();
		beatSource.stop();
		beatSource = null;
	}
	pausedAt = 0;
	startedAt = 0;
}

var piCounter = 0;

var beatValSmoothed = 1;

var colors = [
	/*
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
	*/
	{r:255,g:255,b:255},
	{r:255,g:0,b:0},
	{r:255,g:255,b:255},
	{r:255,g:255,b:0},
	{r:255,g:255,b:255}
];
var currentColor = 0;

let rot = 0;
let rotD = 1;

function draw() {
	if(paused){
		return;
	}
	stats.begin();

	analyser.getByteTimeDomainData(dataArray);
	beatAnalyser.getByteTimeDomainData(lowPassDataArray);

	//canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.03)';
	//canvasCtx.fillRect(0,0,canvas.width,canvas.height);

	overlayCanvasCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

	piCounter+=0.05;
	if(piCounter>Math.PI*2){
		piCounter=0;
	}

	var beatVal = Math.abs(lowPassDataArray[0]-128)/64;

	if(beatVal > 1){
		rotD *= -1;
		beatVal = 1;
		currentColor++;
		if(currentColor === colors.length){
			currentColor = 0;
		}
	}

	beatValSmoothed = smoothMove(beatValSmoothed,beatVal);



	var r = Math.floor((colors[currentColor].r)*beatVal);
	var g = Math.floor((colors[currentColor].g)*beatVal);
	var b = Math.floor((colors[currentColor].b)*beatVal);

	var rgb = 'rgb('+r+','+g+','+b+')';

	//drawCircle(rgb,dataArray);

	canvasCtx.fillStyle = '#ffffff';

	//console.log(rotD);
	rot += 0.02 * rotD;
	if(rot > Math.PI*2){
		rot = 0;
	}

	let logoX = canvas.width/2;//Math.sin(rot)*200+canvas.height/2;
	let logoY = canvas.height/2;//Math.sin(rot)*200+canvas.height/2;


	mgBorder.draw(logoX,logoY,beatValSmoothed+1,rgb,rot,false);

	var fadeSpeed = Math.abs(beatValSmoothed)*30+1;
	//fadeSpeed = 15;
	if(flowIn){
		canvasCtx.drawImage(canvasCtx.canvas, 0, 0, canvas.width, canvas.height, fadeSpeed, fadeSpeed, canvas.width - fadeSpeed*2, canvas.height - fadeSpeed*2);
	}else{
		canvasCtx.drawImage(canvasCtx.canvas, 0, 0, canvas.width, canvas.height, -fadeSpeed, -fadeSpeed, canvas.width + fadeSpeed*2, canvas.height + fadeSpeed*2);
	}
	//Draw this on a separate canvas??? oooh, yes I like that.
	mgBorder2.draw(logoX,logoY,beatValSmoothed+1,'rgb(0,0,0)',rot,true);
	mgBorder2.draw(logoX,logoY,beatValSmoothed+1,'rgb(255,255,255)',rot,false);


	document.getElementById('logo').style.transform = "translate(-50%, -50%) scale("+(beatValSmoothed+1)+","+(beatValSmoothed+1)+")";
	document.getElementById('logo').style.opacity = 1;//0.2+beatValSmoothed;

	stats.end();

	requestAnimationFrame(draw);
}

function smoothMove(from,to){
	var temp;
	if(from<to)
		temp=(from+(0.1*Math.abs(from-to)));
	else
		temp=(from-(0.1*Math.abs(from-to)));
	return temp;
}

function drawCircle(color,data){
	canvasCtx.strokeStyle = color;
	canvasCtx.lineWidth = 8;
	canvasCtx.beginPath();
	var circleRadius = 150;
	for(var i = 0; i < bufferLength; i++) {
		var spike = data[i] -128;
		var x = canvas.width/2 + Math.cos((Math.PI*2)*(i/bufferLength)+(Math.PI/2))*(circleRadius+spike);
		var y = canvas.height/2 + Math.sin((Math.PI*2)*(i/bufferLength)+(Math.PI/2))*(circleRadius+spike);
		if(i === 0) {
			canvasCtx.moveTo(x, y);
		} else {
			canvasCtx.lineTo(x, y);
		}
	}
	var firstSpike =  (data[0] -128);
	var lastX = canvas.width/2 + Math.cos(0+(Math.PI/2))*(circleRadius+firstSpike);
	var lastY = canvas.height/2 + Math.sin(0+(Math.PI/2))*(circleRadius+firstSpike);
	canvasCtx.lineTo(lastX, lastY);
	canvasCtx.stroke();
}

function drawCenteredSquare(ctx,x,y,width,height){
	ctx.rect(x-width/2,y-height/2,width,height)
}