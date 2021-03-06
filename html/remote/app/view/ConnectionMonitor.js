var localSocket = null;
var obsSocket = null;
var twitchSocket = null;

Ext.define('MG.view.ConnectionMonitor', {
	itemId:'connectionMonitor',
	extend: 'Ext.container.Container',
	alias: 'widget.connectionmonitor',
	requires: [
		'Ext.form.field.Display'
	],
	layout: {
		type: 'vbox',
		align: 'stretch'
	},
	items: [
		{
			xtype: 'container',
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: [
				{
					xtype: 'container',
					cls: [
						'status',
						'statusRed'
					],
					flex: 1,
					html: 'Streaming',
					itemId: 'streamingStatus'
				},
				{
					xtype: 'container',
					cls: [
						'status',
						'statusRed'
					],
					flex: 1,
					html: 'Recording',
					itemId: 'recordingStatus'
				}
			]
		},
		{
			xtype: 'container',
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: [
				{
					xtype: 'container',
					flex: 1,
					cls: [
						'status',
						'statusRed'
					],
					html: 'Local Socket',
					itemId: 'localSocketStatus'
				},
				{
					xtype: 'container',
					flex: 1,
					cls: [
						'status',
						'statusRed'
					],
					html: 'OBS Socket',
					itemId: 'obsSocketStatus'
				},
				{
					xtype: 'container',
					flex: 1,
					cls: [
						'status',
						'statusRed'
					],
					html: 'Twitch Socket <span id="queueCount"></span>',
					itemId: 'twitchSocketStats'
				}
			]
		}
	],
	defaultListenerScope: true,
	listeners:{
		afterrender:function(){
			localSocket = new SocketHelper({
				url:document.location.host+'/webSocket?user=remote',
				onConnect:this.localConnected,
				onClose:this.localClosed,
				onMessage:this.localMessage,
				scope:this
			});
			localSocket.connect();
			obsSocket = new SocketHelper({
				url:document.location.host+':4444',
				onConnect:this.obsConnected,
				onClose:this.obsClosed,
				onMessage:this.obsMessage,
				messageIdKey:'message-id',
				stringMessageIdKey:true,
				scope:this
			});
			obsSocket.connect();
		}
	},
	localConnected:function(){
		var localSocketStatus = this.queryById('localSocketStatus');
		localSocketStatus.removeCls('statusRed');
		localSocketStatus.addCls('statusGreen');
		/*
		setInterval(function(){
			if(!this.ttttime){
				this.ttttime = 0;
			}
			this.pushToChart('kbpsGraph',Math.floor(Math.random()*5000),this.ttttime);
			this.pushToChart('dropGraph',Math.random()*100,this.ttttime);
			this.ttttime+=2;
		}.bind(this),100);
		*/
		/*
		let graphWrap = Ext.ComponentQuery.query('#graphWrap')[0];
		graphWrap.removeAll(true);
		graphWrap.add(this.generateGraph('kbpsGraph','KBPS','0,150,136',5000));
		graphWrap.add(this.generateGraph('dropGraph','DROP %','244,67,54',100));
		*/

	},
	localClosed:function(){
		var localSocketStatus = this.queryById('localSocketStatus');
		localSocketStatus.removeCls('statusGreen');
		localSocketStatus.addCls('statusRed');
	},
	localMessage:function(message){
		if(message.action === 'frame'){
			Ext.ComponentQuery.query("#imageWrap")[0].setHtml('<img src="data:image/jpeg;base64,' + message.image + '"/>');
		}
	},
	obsConnected:function(){
		var obsSocketStatus = this.queryById('obsSocketStatus');

		obsSocket.sendPromise({'request-type': "GetAuthRequired"}).then((reply) =>{
			const {authRequired,salt,challenge} = reply;
			if(!authRequired){
				obsSocketStatus.removeCls('statusRed');
				obsSocketStatus.addCls('statusGreen');
				return;
			}

			var shaObj = new jsSHA("SHA-256", "TEXT");
			shaObj.update('test');
			shaObj.update(salt);
			var hash = shaObj.getHash("B64");
			var authHash = new jsSHA("SHA-256", "TEXT");
			authHash.update(hash);
			authHash.update(challenge);

			return obsSocket.sendPromise({
				'request-type': 'Authenticate',
				'auth':authHash.getHash("B64")
			});
		}).then((reply) => {
			obsSocketStatus.removeCls('statusRed');
			obsSocketStatus.addCls('statusGreen');
			return obsSocket.sendPromise({
				'request-type': 'GetStreamingStatus'
			});
		}).then((reply) => {
			if(reply.recording){
				this.obsMessage({'update-type':'RecordingStarted'});
			}
			if(reply.streaming){
				this.obsMessage({'update-type':'StreamStarted'});
			}
		}).catch((reply) => {
			console.error(reply);
			obsSocketStatus.removeCls('statusGreen');
			obsSocketStatus.addCls('statusRed');
		});
	},
	obsClosed:function() {
		var obsSocketStatus = this.queryById('obsSocketStatus');
		obsSocketStatus.removeCls('statusGreen');
		obsSocketStatus.addCls('statusRed');
	},
	obsMessage:function(message){
		if(message.hasOwnProperty('update-type')){
			var streamingStatus = this.queryById('streamingStatus');
			var recordingStatus = this.queryById('recordingStatus');
			//var kbpsGraph = Ext.ComponentQuery.query('#kbpsGraph')[0];
			//var dropGraph = Ext.ComponentQuery.query('#dropGraph')[0];
			switch(message['update-type']){
				case 'RecordingStopped':
					recordingStatus.removeCls('statusGreen');
					recordingStatus.addCls('statusRed');
					break;
				case 'RecordingStarted':
					recordingStatus.removeCls('statusRed');
					recordingStatus.addCls('statusGreen');
					break;
				case 'StreamStopped':
					streamingStatus.removeCls('statusGreen');
					streamingStatus.addCls('statusRed');
					break;
				case 'StreamStarted':
					streamingStatus.removeCls('statusRed');
					streamingStatus.addCls('statusGreen');
					let graphWrap = Ext.ComponentQuery.query('#graphWrap')[0];
					graphWrap.removeAll(true);
					graphWrap.add(this.generateGraph('kbpsGraph','KBPS','0,150,136'));
					graphWrap.add(this.generateGraph('dropGraph','DROP %','244,67,54'));
					break;
				case 'StreamStatus':
					this.pushToChart('kbpsGraph',message['kbits-per-sec'],message['total-stream-time']);
					this.pushToChart('dropGraph',Math.floor(message['strain']*100),message['total-stream-time']);
					if(message['rec-timecode']){
						//let seconds = 0;
						let hours=message['rec-timecode'].substring(0,2);
						let minutes=message['rec-timecode'].substring(3,5);
						let seconds=parseInt(message['rec-timecode'].substring(6,8));
						if(seconds>3){
							seconds -= 3;
						}
						if(seconds < 10){
							seconds = '0'+seconds;
						}
						//console.log(seconds);
						localSocket.send({'action':'getFrame','timestamp':hours+":"+minutes+":"+seconds})
					}
					break;
			}
		}
	},
	twitchConnected:function(){
		console.log('connected!');
		var twitchSocketStats = this.queryById('twitchSocketStats');
		twitchSocketStats.removeCls('statusRed');
		twitchSocketStats.addCls('statusGreen');
	},
	twitchClosed:function(){
		var twitchSocketStats = this.queryById('twitchSocketStats');
		twitchSocketStats.removeCls('statusGreen');
		twitchSocketStats.addCls('statusRed');
	},
	twitchMessage:function(message){
		console.log(message);
		if(message.action === 'userFollow'){
			this.sendFollowNotification(message.userId);
		}
	},
	sendFollowNotification:function(userId){
		if(!this.followBuffer){
			this.followBuffer = [];
		}
		if(!this.duplicateBuffer){
			this.duplicateBuffer = [];
		}
		if(this.duplicateBuffer.indexOf(userId) === -1) {
			this.followBuffer.push(userId);
		}
		this.duplicateBuffer.push(userId);
		if(this.duplicateBuffer.length > 50){
			this.duplicateBuffer.shift();
		}
		this.processFollowBuffer();
	},
	processFollowBuffer:function(){
		if(this.lastSent && Math.abs(new Date() - this.lastSent)/1000 < 2.5){
			setTimeout(this.processFollowBuffer.bind(this),100);
			return;
		}
		if(this.followBuffer.length === 0){
			return;
		}
		this.lastSent = new Date();
		var nextId = this.followBuffer.shift();
		document.getElementById('queueCount').innerHTML = this.followBuffer.length;
		Ajax.request({
			url: 'https://api.twitch.tv/helix/users?id='+nextId,
			headers: {
				'Client-ID': this.currentClientId
			},
			method: 'GET',
			success: function (reply) {
				localSocket.send({
					to: 'stream',
					action: 'notification',
					text:reply.data[0].display_name+' Just Followed!',
					time: 3000
				});
			}
		});
	},
	pushToChart:function(graph,value,time){
		let chart = Ext.ComponentQuery.query('#'+graph)[0],
			store = chart.getStore(),
			count = store.getCount(),
			xAxis = chart.getAxes()[1],
			visibleRange = 120,
			xValue;
		if(count > visibleRange){
			store.removeAt(0);
		}
		if (count > 0) {
			xValue = time;//message['total-stream-time'];
			if (xValue > visibleRange) {
				xAxis.setMinimum(xValue - visibleRange);
				xAxis.setMaximum(xValue);
			}
			store.add({
				xValue: xValue,
				yValue: value,
				//y2Value: Math.ceil(message['strain']*100)
			});
		} else {
			chart.animationSuspended = true;
			xAxis.setMinimum(0);
			xAxis.setMaximum(visibleRange);
			store.add({
				xValue: time,//message['total-stream-time'],
				yValue: value,
				//y2Value: Math.ceil(message['strain']*100)
			});
			chart.animationSuspended = false;
		}
	},
	generateGraph:function(itemId,title,color,max){
		return Ext.create('Ext.chart.CartesianChart',{
			xtype: 'cartesian',
			flex:1,
			itemId:itemId,
			animation:false,
			width:300,
			insetPadding: '10 25 0 0 ',
			//reference: 'number-chart',
			store: Ext.create('Ext.data.JsonStore', {
				fields: ['yValue', 'xValue']
			}),
			axes: [{
				type: 'numeric',
				minimum: 0,
				maximum: max,
				grid: true,
				position: 'left',
				title: title,
			}, {
				type: 'numeric',
				grid: true,
				position: 'bottom',
				title: 'Time',
				//fields: ['xValue'],
				style: {
					textPadding: 0
				},
				renderer: 'onAxisLabelRender'
			}],
			series: [{
				type: 'line',
				//title: 'KBPS',
				//label: {
				//	display: 'over',
				//	field: 'yValue'
				//},
				marker: {
					radius: 3
				},
				style: {
					lineWidth: 3,
					miterLimit: 0,
					fillStyle:'rgba('+color+',0.5)',
					strokeStyle:'rgb('+color+')'
				},
				xField: 'xValue',
				yField: ['yValue']
			}]
		});
	}
});