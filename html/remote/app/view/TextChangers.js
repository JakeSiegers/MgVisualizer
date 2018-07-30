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
						align: 'stretch'
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
						align: 'stretch'
					},
					items: [
						{
							xtype: 'textfield',
							fieldLabel: 'Primary Text',
							emptyText: 'MG @ Smashcon',
							itemId:'primaryText'
						},
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
							fieldLabel: 'Player 1',
							emptyText: '[ Empty ]'
						},
						{
							xtype: 'textfield',
							fieldLabel: 'Player 2',
							emptyText: '[ Empty ]'
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
							fieldLabel: 'Player 3',
							emptyText: '[ Empty ]'
						},
						{
							xtype: 'textfield',
							fieldLabel: 'Player 4',
							emptyText: '[ Empty ]'
						},
						{
							xtype: 'button',
							text: 'Send'
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
						},
						{
							xtype: 'textfield',
							fieldLabel: 'Client Id',
							itemId:'twitchClientId'
						},
						{
							xtype: 'button',
							text: 'Connect',
							listeners:{
								afterrender:'checkTwitchLocalStorage',
								click:'connectToTwitch'
							}
						}
					]
				}
			]
		},
		{
			xtype: 'container',
			flex: 1,
			layout: 'fit',
			items: [
				{
					xtype: 'propertygrid',
					title: 'Stream Stats',
					itemId:'streamStats'
				}
			]
		}

	],
	checkTwitchLocalStorage:function(){
		console.log('check twitch localstorage');
		var twitchRemoteUrl = window.localStorage.getItem('twitchRemoteUrl');
		var twitchClientId = window.localStorage.getItem('twitchClientId');
		this.queryById('twitchRemoteUrl').setValue(twitchRemoteUrl);
		this.queryById('twitchClientId').setValue(twitchClientId);

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
		localSocket.send({to: 'stream', action: 'updateText',text:primaryText});
	},
	resetText:function(){
		localSocket.send({to: 'stream', action: 'updateText',text:'McLeodGaming @ Smash Con 2018'});
	}
});