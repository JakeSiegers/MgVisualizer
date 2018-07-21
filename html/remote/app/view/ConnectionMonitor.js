var localSocket = null;

Ext.define('MG.view.ConnectionMonitor', {
	extend: 'Ext.container.Container',
	alias: 'widget.connectionmonitor',
	requires: [
		'Ext.form.field.Display'
	],
	defaults: {
		margin: 5
	},
	layout: {
		type: 'hbox',
		align: 'stretch'
	},
	items: [
		{
			xtype: 'displayfield',
			itemId: 'localSocketLabel',
			fieldLabel: 'Local Socket',
			value: 'Disconnected',
			fieldStyle: 'color:red;'
		},
		{
			xtype: 'displayfield',
			itemId: 'obsSocketLabel',
			fieldLabel: 'OBS Socket',
			value: 'Disconnected',
			fieldStyle: 'color:red;'
		},
		{
			xtype: 'displayfield',
			itemId: 'twitchSocketLabel',
			fieldLabel: 'Twitch Notification Socket',
			labelWidth: 180,
			value: 'Disconnected',
			fieldStyle: 'color:red;'
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
		}
	},
	localConnected:function(){
		var localSocketLabel = this.queryById('localSocketLabel');
		localSocketLabel.setFieldStyle('color:green');
		localSocketLabel.setValue('Connected');
	},
	localClosed:function(){
		var localSocketLabel = this.queryById('localSocketLabel');
		localSocketLabel.setFieldStyle('color:red');
		localSocketLabel.setValue('Disconnected');
	}

});