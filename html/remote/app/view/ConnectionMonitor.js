var localSocket = null;
var obsSocket = null;

Ext.define('MG.view.ConnectionMonitor', {
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
					html: 'Twitch Socket',
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
			shaObj.update('test test test');
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
			var streamStats = Ext.ComponentQuery.query('#streamStats')[0];
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
					streamStats.setSource({});
					break;
				case 'StreamStarted':
					streamingStatus.removeCls('statusRed');
					streamingStatus.addCls('statusGreen');
					break;
				case 'StreamStatus':
					streamStats.setSource(message);
					break;
			}
		}


		/*
		{
			"update-type": "RecordingStarting"
		}
		*/
	}
});