Ext.define('MG.view.Buttons', {
	extend: 'Ext.container.Container',
	alias: 'widget.buttons',
	requires: [
		'Ext.container.Container',
		'Ext.button.Button'
	],
	padding: 5,
	defaults: {
		margin: '5 0 5 0'
	},
	layout: {
		type: 'vbox',
		align: 'stretch'
	},
	items: [
		{
			xtype: 'container',
			flex: 1,
			defaults: {
				margin: '0 5 0 5'
			},
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: [
				{
					xtype: 'button',
					flex: 1,
					text: 'MUSIC SCENE',
					listeners:{
						click:function(){
							obsSocket.send({"request-type":"SetCurrentScene","scene-name":'music'});
						},
						scope:this
					}
				},
				{
					xtype: 'button',
					flex: 1,
					text: 'SSF2 SCENE',
					listeners:{
						click:function(){
							obsSocket.send({"request-type":"SetCurrentScene","scene-name":'ssf2'});
						},
						scope:this
					}
				},
				{
					xtype: 'button',
					flex: 1,
					text: ''
				},
				{
					xtype: 'button',
					flex: 1,
					text: ''
				}
			]
		},
		{
			xtype: 'container',
			flex: 1,
			defaults: {
				margin: '0 5 0 5'
			},
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: [
				{
					xtype: 'button',
					flex: 1,
					text: 'PLAY MUSIC'
				},
				{
					xtype: 'button',
					flex: 1,
					text: 'PAUSE MUSIC'
				},
				{
					xtype: 'button',
					flex: 1,
					text: ''
				},
				{
					xtype: 'button',
					flex: 1,
					text: ''
				}
			]
		}
	],
});