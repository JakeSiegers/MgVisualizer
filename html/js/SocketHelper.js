class SocketHelper{
    constructor(config){
        this.conn = null;
	    this.connected = false;
        this.config = {
	        url:'',
		    onConnect:function(){console.log("Connection Opened");},
		    onClose:function(){console.log("Connection Closed");},
		    onMessage:function(message){console.log(message);},
	        onError:function(message){console.error(message);},
		    scope:this,
	    };

	    Object.assign(this.config,config);
    }

    connect(){
        if(!window["WebSocket"]) {
	        console.error("Your browser does not support WebSockets");
	        return;
        }
        if(this.connected){
	        console.error('WebSocket already connected!');
	        return;
        }
        this.conn = new WebSocket("ws://"+this.config.url);
        this.conn.onopen = function(e){
        	this.connected = true;
            this.config.onConnect.call(this.config.scope);
        }.bind(this);
        this.conn.onclose = function(e) {
	        this.connected = false;
	        this.config.onClose.call(this.config.scope);
        }.bind(this);
        this.conn.onmessage = function (e) {
            let messages = e.data.split('\n');
            for (let i = 0; i < messages.length; i++) {
            	let data = JSON.parse(messages[i]);
            	if(data.hasOwnProperty('error') && data.error){
		            this.config.onError.call(this.config.scope,data);
	            }else {
		            this.config.onMessage.call(this.config.scope, data);
	            }
            }
        }.bind(this);
    }

    send(message){
    	if(!this.connected){
    		console.error('WebSocket not connected! Cannot Send!');
    		return;
	    }
        this.conn.send(JSON.stringify(message));
    }
}

