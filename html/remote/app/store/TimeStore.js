Ext.define('MG.store.TimeStore', {
    extend: 'Ext.data.Store',

    requires: [
        'Ext.data.field.Field'
    ],

    constructor: function(cfg) {
        var me = this;
        cfg = cfg || {};
        me.callParent([Ext.apply({
            fields: [
                {
                    name: 'time'
                },
                {
                    name: 'seconds'
                }
            ]
        }, cfg)]);
    }
});