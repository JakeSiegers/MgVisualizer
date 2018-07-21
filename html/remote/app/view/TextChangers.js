Ext.define('MG.view.TextChangers', {
	extend: 'Ext.container.Container',
	alias: 'widget.textchangers',
	requires: [
		'Ext.container.Container',
		'Ext.form.field.ComboBox',
		'Ext.button.Button',
		'Ext.form.field.Display'
	],
	defaultListenerScope: true,
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
					listeners: {
						afterrender: 'onComboboxAfterRender'
					}
				},
				{
					xtype: 'button',
					iconCls: '',
					text: 'Start Timer'
				},
				{
					xtype: 'button',
					text: 'Stop Timer'
				},
				{
					xtype: 'displayfield',
					height: 20,
					fieldLabel: 'Timer:',
					value: '00:00'
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
					fieldLabel: 'Primary Text',
					emptyText: 'MG @ Smashcon'
				},
				{
					xtype: 'button',
					text: 'Update Text'
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
		}
	],
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
			localSocket.send({to: 'stream', action: 'notification', text:notificationText, time: 1000});
			this.queryById('notificationText').setValue('');
		}
	}
});