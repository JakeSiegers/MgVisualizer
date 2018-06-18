/*
	Jake's MG Visualizer 2018 - MIT license.
*/
let beatSource;
let beatAnalyser;
let beatBufferLength;

let audioCtx;
let source;
let analyser;
let bufferLength;
let dataArray;
let lowPassDataArray;

let canvas = document.querySelector('.visualizer');
let canvasCtx = canvas.getContext("2d");
canvasCtx.fillStyle = 'rgb(0, 0, 0)';
canvasCtx.fillRect(0, 0, canvas.width,  canvas.height);

let overlayCanvas = document.querySelector('.overlay');
let overlayCanvasCtx = overlayCanvas.getContext("2d");
overlayCanvasCtx.fillStyle = 'rgb(0, 0, 0)';
overlayCanvasCtx.fillRect(0, 0, overlayCanvas.width,  overlayCanvas.height);

let logoRotation = Math.PI;
let beatValSmoothed = 0;
let logoRotationTween = new JakeTween({
	from:logoRotation,
	to:Math.PI,
	animTime:2000,
	easeFn:JakeTween.easing.quadratic.out
}).start();
let beatValTween = new JakeTween({
	from:beatValSmoothed,
	to:0,
	animTime:50,
	easeFn:JakeTween.easing.linear
}).start();

let ticker = new Ticker(overlayCanvas);

let fist = new Image();
fist.src = 'fist.png';

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

let mgBorder = new PathDrawer({
	points:points,
	ctx:overlayCanvasCtx
});
let mgBgBorder = new PathDrawer({
	points:points,
	ctx:canvasCtx
});

let alreadyDrawing = false;

let stats = new Stats();
//document.body.appendChild( stats.dom );

audioCtx = new window.AudioContext();

let musicQueue = [];
let currentSong = 0;
let loadingSong = false;

let startedAt = 0;
let pausedAt = 0;
let paused = false;
let buffer = null;
let flowIn = false;


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
		case 'c':
			currentColor = 0;
			if(colors === mgColor){
				colors = rainColor;
			}else{
				colors = mgColor;
			}
			break;
	}
};

function loadSong(file){
	loadingSong = true;

	let dot = file.name.lastIndexOf('.');
	if(dot !== -1){
		ticker.setSong(file.name.substring(0,dot));
	}else{
		ticker.setSong(file.name);
	}

	stop();
	let reader = new FileReader();
	reader.onload = function() {
		audioCtx.decodeAudioData(reader.result, function(newBuffer){
			buffer = newBuffer;
			play();
			ticker.show();
		});
	};
	reader.readAsArrayBuffer(file);
}

function play(){

	let offset = pausedAt;

	//beatContext = new window.AudioContext();
	beatSource = audioCtx.createBufferSource();
	beatSource.buffer = buffer;
	beatSource.loop = false;
	let filter = audioCtx.createBiquadFilter();
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
	let elapsed = audioCtx.currentTime - startedAt;
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

let piCounter = 0;


let mgColor = [
	{r:255,g:0,b:0},
	{r:255,g:255,b:0},
	{r:255,g:255,b:255}
];

let rainColor = [
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

let colors = mgColor;
let currentColor = 0;

let rotD = 1;
let lastBeatVals = [];
let beatPeak = 1;

function draw(time) {
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

	let beatVal = Math.abs(lowPassDataArray[0]-128)/64;
	if(beatVal >= beatPeak && !lastBeatVals.includes(beatPeak)){
		rotD *= -1;
		logoRotationTween.updateTo(logoRotation,Math.PI*rotD);
		beatVal = beatPeak;
		currentColor++;
		if(currentColor === colors.length){
			currentColor = 0;
		}
	}
	lastBeatVals.push(beatVal);
	if(lastBeatVals.length > 1){
		lastBeatVals.shift();
	}

	beatValSmoothed = beatValTween.getValue();
	//Tone this down a bit for the logo bouncing.
	let logoBeatValSmoothed = beatValSmoothed/3;
	beatValTween.updateTo(beatValSmoothed,beatVal);
	logoRotation = logoRotationTween.getValue();

	let r = Math.floor((colors[currentColor].r)*beatValSmoothed);
	let g = Math.floor((colors[currentColor].g)*beatValSmoothed);
	let b = Math.floor((colors[currentColor].b)*beatValSmoothed);

	let rgb = 'rgb('+r+','+g+','+b+')';

	//drawCircle(rgb,dataArray);

	canvasCtx.fillStyle = '#ffffff';

	let logoX = canvas.width/2;//Math.sin(rot)*200+canvas.height/2;
	let logoY = canvas.height/2;//Math.sin(rot)*200+canvas.height/2;

	mgBgBorder.setConfigs({
		drawX:logoX,
		drawY:logoY,
		scale:logoBeatValSmoothed+1,
		color:rgb,
		angle:logoRotation,
		fill:false
	}).draw();

	let fadeSpeed = Math.abs(beatValSmoothed)*30+5;
	//fadeSpeed = 15;
	if(flowIn){
		canvasCtx.drawImage(canvasCtx.canvas, 0, 0, canvas.width, canvas.height, fadeSpeed, fadeSpeed, canvas.width - fadeSpeed*2, canvas.height - fadeSpeed*2);
	}else{
		canvasCtx.drawImage(canvasCtx.canvas, 0, 0, canvas.width, canvas.height, -fadeSpeed, -fadeSpeed, canvas.width + fadeSpeed*2, canvas.height + fadeSpeed*2);
	}

	mgBorder.setConfigs({
		drawX:logoX,
		drawY:logoY,
		scale:logoBeatValSmoothed+1,
		color:'rgb(0,0,0)',
		angle:logoRotation,
		fill:true
	}).draw();
	mgBorder.setConfigs({
		color:'rgb(255,255,255)',
		fill:false
	}).draw();

	let logoWidth = 150*(logoBeatValSmoothed+1);
	let logoHeight = 140*(logoBeatValSmoothed+1);
	overlayCanvasCtx.drawImage(fist,canvas.width/2-logoWidth/2,canvas.height/2-logoHeight/2,logoWidth,logoHeight);

	ticker.draw();

	requestAnimationFrame(draw);
	stats.end();
}

function drawCircle(color,data){
	canvasCtx.strokeStyle = color;
	canvasCtx.lineWidth = 8;
	canvasCtx.beginPath();
	let circleRadius = 110;
	for(let i = 0; i < bufferLength; i++) {
		let spike = data[i] -128;
		let x = canvas.width/2 + Math.cos((Math.PI*2)*(i/bufferLength)+(Math.PI/2))*(circleRadius+spike);
		let y = canvas.height/2 + Math.sin((Math.PI*2)*(i/bufferLength)+(Math.PI/2))*(circleRadius+spike);
		if(i === 0) {
			canvasCtx.moveTo(x, y);
		} else {
			canvasCtx.lineTo(x, y);
		}
	}
	let firstSpike =  (data[0] -128);
	let lastX = canvas.width/2 + Math.cos(Math.PI/2)*(circleRadius+firstSpike);
	let lastY = canvas.height/2 + Math.sin(Math.PI/2)*(circleRadius+firstSpike);
	canvasCtx.lineTo(lastX, lastY);
	canvasCtx.stroke();
}