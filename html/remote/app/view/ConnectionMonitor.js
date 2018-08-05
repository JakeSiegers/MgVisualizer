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
		}.bind(this),2000);
		*/

	},
	localClosed:function(){
		var localSocketStatus = this.queryById('localSocketStatus');
		localSocketStatus.removeCls('statusGreen');
		localSocketStatus.addCls('statusRed');
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
			//var streamStats = Ext.ComponentQuery.query('#streamStats')[0];
			var kbpsGraph = Ext.ComponentQuery.query('#kbpsGraph')[0];
			var dropGraph = Ext.ComponentQuery.query('#dropGraph')[0];
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
					//streamStats.setSource({});
					break;
				case 'StreamStarted':
					streamingStatus.removeCls('statusRed');
					streamingStatus.addCls('statusGreen');

					kbpsAxis = kbpsGraph.getAxes()[1];
					kbpsAxis.setMinimum(0);
					kbpsAxis.setMaximum(20);

					dropAxis = dropGraph.getAxes()[1];
					dropAxis.setMinimum(0);
					dropAxis.setMaximum(20);
					break;
				case 'StreamStatus':
					//streamStats.setSource(message);
					console.log(message['strain']);
					this.pushToChart('kbpsGraph',message['kbits-per-sec'],message['total-stream-time']);
					this.pushToChart('dropGraph',Math.floor(message['strain']*100),message['total-stream-time']);
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
		this.followBuffer.push(userId);
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
					time: 1500
				});
			}
		});
	},
	pushToChart:function(graph,value,time){
		let chart = Ext.ComponentQuery.query('#'+graph)[0],
			store = chart.getStore(),
			count = store.getCount(),
			xAxis = chart.getAxes()[1],
			visibleRange = 20,
			xValue;
		if(count > 40){
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
	}
});