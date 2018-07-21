var allMusicStore = Ext.create('Ext.data.Store',{
	'fields': ['song']
});
var musicQueueStore = Ext.create('Ext.data.Store',{
	'fields': ['song']
});
var musicGridColumns = [{
	text: 'Song',
	dataIndex: 'song',
	flex:1
}];

Ext.define('MG.view.MusicGrids', {
	extend: 'Ext.container.Container',
	alias: 'widget.musicgrids',
	requires: [
		'Ext.grid.Panel',
		'Ext.layout.container.HBox'
	],
	defaultListenerScope: true,
	layout: {
		type: 'hbox',
		align: 'stretch'
	},
	items: [{
		xtype: 'grid',
		title: 'All Music',
		itemId: 'grid1',
		flex: 1,
		viewConfig: {
			plugins: {
				ptype: 'gridviewdragdrop',
				containerScroll: true,
				copy:true,
				ddGroup:'dd',
			}
		},
		listeners: {
			drop: function(){
				Ext.ComponentQuery.query('#grid2')[0].updateQueue();
			}
		},
		store: allMusicStore,
		columns: musicGridColumns,

	}, {
		xtype: 'grid',
		title: 'Current Queue',
		itemId: 'grid2',
		flex: 1,
		viewConfig: {
			plugins: {
				ptype: 'gridviewdragdrop',
				containerScroll: true,
				ddGroup:'dd',
			},
		},
		listeners: {
			drop: function(){
				this.updateQueue();
			},
			beforedrop:function(node,data){
				return data.view.up().getItemId() === 'grid2' || this.currentQueue.indexOf(data.records[0].data.song) === -1;
			},
			afterrender:function(gridWrap){
				Ajax.request({
					url: '/api/getMusic',
					success: function (reply) {
						allMusicStore.loadData(reply.music);
					},
					scope:this
				});

				Ajax.request({
					url: '/api/getMusicQueue',
					success: function (reply) {
						musicQueueStore.loadData(reply.musicQueue);
						this.currentQueue = [];
						musicQueueStore.getData().each(function(item){
							this.currentQueue.push(item.data.song);
						},this);
					},
					scope:this
				});
			}
		},
		updateQueue:function(){
			this.currentQueue = [];
			musicQueueStore.getData().each(function(item){
				this.currentQueue.push(item.data.song);
			},this);

			Ajax.request({
				url:'/api/setMusicQueue',
				params:{music:this.currentQueue},
			});
		},
		store: musicQueueStore,
		columns: musicGridColumns,
	}]
});