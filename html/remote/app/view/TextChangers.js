Ext.define('MG.view.TextChangers', {
	extend: 'Ext.container.Container',
	alias: 'widget.textchangers',
	requires: [
		'Ext.container.Container',
		'Ext.form.field.ComboBox',
		'Ext.button.Button',
		'Ext.form.field.Display',
		'Ext.grid.property.Grid'
	],
	defaultListenerScope: true,
	layout: {
		type: 'hbox',
		align: 'stretch'
	},
	listeners:{
		afterrender:'checkLocalStorage'
	},
	items: [
		{
			xtype: 'container',
			items: [
				{
					xtype: 'container',
					defaults: {
						margin: 5
					},
					layout: {
						type: 'hbox',
						align: 'bottom'
					},
					items: [
						{
							xtype: 'combobox',
							fieldLabel: 'Timer',
							displayField: 'time',
							forceSelection: true,
							queryMode: 'local',
							store: 'TimeStore',
							valueField: 'seconds',
							itemId: 'timePicker',
							labelAlign:'top',
							listeners: {
								afterrender: 'onComboboxAfterRender'
							}
						},
						{
							xtype: 'button',
							iconCls: '',
							text: 'Start Timer',
							listeners:{
								click:'startTimer'
							}
						},
						{
							xtype: 'button',
							text: 'Stop Timer',
							listeners:{
								click:'stopTimer'
							}
						},
					]
				},
				{
					xtype: 'container',
					defaults: {
						margin: 5
					},
					layout: {
						type: 'hbox',
						align: 'bottom'
					},
					items: [
						{
							xtype: 'textfield',
							fieldLabel: 'Primary Text',
							emptyText: 'SSF2 at Smash Con 2019',
							itemId:'primaryText',
							width:400,
							labelAlign:'top'
						}
					]
				},
				{
					xtype: 'container',
					defaults: {
						margin: 5
					},
					layout: {
						type: 'hbox',
						align: 'stretch'
					},
					items: [
						{
							xtype: 'button',
							text: 'Update Text',
							listeners:{
								click:'updateText'
							}
						},
						{
							xtype: 'button',
							text: 'Reset Text',
							listeners:{
								click:'resetText'
							}
						}
					]
				},
				{
					xtype: 'container',
					defaults: {
						margin: 5
					},
					layout: {
						type: 'hbox',
						align: 'stretch'
					},
					items: [
						{
							xtype: 'textfield',
							fieldLabel: 'Notification',
							itemId:'notificationText'
						},
						{
							xtype: 'button',
							text: 'Send',
							listeners:{
								click:'sendNotification'
							}
						}
					]
				},
				{
					xtype: 'container',
					defaults: {
						margin: 5
					},
					layout: {
						type: 'hbox',
						align: 'stretch'
					},
					items: [
						{
							xtype: 'textfield',
							fieldLabel: 'Twitch Remote URL',
							labelWidth:150,
							itemId:'twitchRemoteUrl'
						}
					]
				},
				{
					xtype: 'container',
					defaults: {
						margin: 5
					},
					layout: {
						type: 'hbox',
						align: 'stretch'
					},
					items: [
						{
							xtype: 'textfield',
							fieldLabel: 'Client Id',
							itemId:'twitchClientId'
						},
						{
							xtype: 'button',
							text: 'Connect',
							listeners:{
								click:'connectToTwitch'
							}
						}
					]
				},
				{
					xtype: 'container',
					flex: 1,
					defaults: {
						margin: '5 5 0 5',
						height:50,
						width:200
					},
					layout: {
						type: 'hbox',
						align: 'stretch'
					},
					items: [
						{
							xtype: 'button',
							text: 'MUSIC SCENE',
							listeners:{
								click:function(){
									obsSocket.send({"request-type":"SetCurrentScene","scene-name":'music'});
									localSocket.send({"action":"switchToMusic","to":'stream'});
								},
								scope:this
							}
						},
						{
							xtype: 'button',
							text: 'SSF2 SCENE',
							listeners:{
								click:function(){
									obsSocket.send({"request-type":"SetCurrentScene","scene-name":'ssf2'});
									localSocket.send({"action":"switchToGame","to":'stream'});
								},
								scope:this
							}
						}
					]
				},
				{
					xtype: 'container',
					flex: 1,
					defaults: {
						margin: '5 5 0 5',
						height:50,
						width:200
					},
					layout: {
						type: 'hbox',
						align: 'stretch'
					},
					items: [
						{
							xtype: 'button',
							text: 'PLAY MUSIC',
							listeners:{
								click:function(){
									localSocket.send({"action":"play","to":"stream"});
								},
								scope:this
							}
						},
						{
							xtype: 'button',
							text: 'STOP MUSIC',
							listeners:{
								click:function(){
									localSocket.send({"action":"stop","to":"stream"});
								},
								scope:this
							}
						}
					]
				},
				{
					xtype: 'container',
					flex: 1,
					defaults: {
						margin: '5 5 0 5',
						height:50,
						width:200
					},
					layout: {
						type: 'hbox',
						align: 'stretch'
					},
					items: [
						{
							xtype: 'button',
							text: 'PAUSE MUSIC',
							listeners:{
								click:function(){
									localSocket.send({"action":"pause","to":"stream"});
								},
								scope:this
							}
						},
					]
				}
			]
		},
		{
			xtype: 'container',
			itemId: 'graphWrap',
			flex: 1,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [
				{
					xtype: 'container',
					itemId: 'graphWrap',
					flex: 1,
					layout: {
						type: 'vbox',
						align: 'stretch'
					},
					items: []
				},
				{
					xtype: 'container',
					itemId: 'imageWrap',
					height:210
				}
			]
		},


	],
	checkLocalStorage:function(){
		var twitchRemoteUrl = window.localStorage.getItem('twitchRemoteUrl');
		var twitchClientId = window.localStorage.getItem('twitchClientId');
		var primaryText = window.localStorage.getItem('primaryText');
		this.queryById('twitchRemoteUrl').setValue(twitchRemoteUrl);
		this.queryById('twitchClientId').setValue(twitchClientId);
		this.connectToTwitch();
		this.queryById('primaryText').setValue(primaryText);

	},
	connectToTwitch:function(){
		var twitchRemoteUrl = this.queryById('twitchRemoteUrl').getValue();
		var twitchClientId = this.queryById('twitchClientId').getValue();
		if(twitchRemoteUrl.trim() === '' || twitchClientId.trim() === ''){
			return;
		}
		console.log(twitchRemoteUrl,twitchClientId);
		window.localStorage.setItem('twitchRemoteUrl',twitchRemoteUrl);
		window.localStorage.setItem('twitchClientId',twitchClientId);
		let connectionMonitor = Ext.ComponentQuery.query('#connectionMonitor')[0];
		connectionMonitor.currentClientId = twitchClientId;
		if(twitchSocket !== null) {
			twitchSocket.close();
			delete twitchSocket;
		}
		connectionMonitor.twitchClosed();
		twitchSocket = new SocketHelper({
			url:twitchRemoteUrl,
			onConnect:connectionMonitor.twitchConnected,
			onClose:connectionMonitor.twitchClosed,
			onMessage:connectionMonitor.twitchMessage,
			scope:connectionMonitor
		});
		twitchSocket.connect();
	},
	onComboboxAfterRender: function(component, eOpts) {
		var times = [];
		for(var i = 10*1000;i<=30*60*1000;i+=10*1000){
			var minutes = ("00"+Math.floor((i/1000)/60)).substr(-2,2);
			var seconds = ("00"+(i/1000)%60).substr(-2,2);
			times.push([minutes+':'+seconds,i]);
		}
		component.getStore().loadData(times);
	},
	sendNotification: function(){
		var notificationText = this.queryById('notificationText').getValue();
		if(notificationText.trim() !== '') {
			localSocket.send({to: 'stream', action: 'notification', text:notificationText, time: 5000});
			this.queryById('notificationText').setValue('');
		}
	},
	startTimer:function(){
		let time = this.queryById('timePicker').getValue();
		if(time > 0) {
			localSocket.send({to: 'stream', action: 'setTimer', time: time});
		}
	},
	stopTimer:function(){
		localSocket.send({to: 'stream', action: 'stopTimer'});
	},
	updateText:function(){
		let primaryText = this.queryById('primaryText').getValue();
		if(primaryText.trim() === ''){
			primaryText = 'SSF2 at Smash Con 2019';
		}
		window.localStorage.setItem('primaryText',primaryText);
		localSocket.send({to: 'stream', action: 'updateText',text:primaryText});
	},
	resetText:function(){
		localSocket.send({to: 'stream', action: 'updateText',text:'SSF2 at Smash Con 2019'});
	},
	onAxisLabelRender: function (axis, label, layoutContext) { // only render interger values
		let seconds = Math.floor(label%60);
		if(seconds < 10){
			seconds = '0'+seconds;
		}
		let minutes = Math.floor(label/60%60);
		if(minutes < 10){
			minutes = '0'+minutes;
		}
		let hours = Math.floor(label/60/60);
		return hours+':'+minutes+':'+seconds;
	}
});