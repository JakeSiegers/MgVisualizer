class SocketHelper{
    constructor(config){
        this.websocket = null;
	    this.connected = false;
	    this.conenctRetry = true;
	    this.connectionAttempts = 0;
	    this.maxConnectionAttempts = 30;
	    this.connectionAttemptDelay = 5000;
	    this.messageId = 1;
        let defaults = {
	        url:'',
		    onConnect:function(){console.log("Connection Opened");},
		    onClose:function(){console.log("Connection Closed");},
		    onMessage:function(message){console.log(message);},
	        onErrorMessage:function(message){console.error(message);},
	        messageIdKey:'messageId',
	        stringMessageIdKey:false,
		    scope:this,
	    };

        this.promises = {};
	    this.config = this.overrideDefaults(config,defaults);
    }

	overrideDefaults(input,defaults) {
		let keys = Object.keys(defaults);
		for (let i = 0; i < keys.length; i++) {
			if(!input.hasOwnProperty(keys[i])){
				input[keys[i]] = defaults[keys[i]];
			}else if(typeof defaults[keys[i]] === 'object' && keys[i] !== 'scope'){
				console.log(keys[i]);
				input[keys[i]] = this.overrideDefaults(input[keys[i]],defaults[keys[i]]);
			}
		}
		return input;
	};

    connect(){
        if(!window["WebSocket"]) {
	        console.error("Your browser does not support WebSockets");
	        return;
        }
        if(this.connected){
	        console.error('WebSocket already connected!');
	        return;
        }
	    this.connectionAttempts++;
	    if(this.connectionAttempts > this.maxConnectionAttempts){
		    this.config.onErrorMessage.call(this.config.scope,{error:'Failed to connect to server after '+this.maxConnectionAttempts+' tries!'});
		    return;
	    }
        this.websocket = new WebSocket("ws://"+this.config.url);
        this.websocket.onopen = function(e){
        	this.connected = true;
	        this.connectionAttempts = 0;
            this.config.onConnect.call(this.config.scope);
        }.bind(this);
        this.websocket.onclose = function(e) {
	        this.connected = false;
	        this.config.onClose.call(this.config.scope);
	        if(this.conenctRetry) {
		        setTimeout(this.connect.bind(this), this.connectionAttemptDelay);
	        }
        }.bind(this);
        this.websocket.onmessage = this.onMessage.bind(this);
    }

    onMessage(event){
	    let data = JSON.parse(event.data);

	    if(data.hasOwnProperty(this.config.messageIdKey) && this.promises.hasOwnProperty(data[this.config.messageIdKey])){
	    	let promise = this.promises[data[this.config.messageIdKey]];
		    if(data.hasOwnProperty('error')){
			    promise.reject(data);
		    }else{
			    promise.resolve(data);
		    }
		    delete this.promises[id];
		    return
	    }

	    if(data.hasOwnProperty('error')){
	    	this.config.onErrorMessage.call(this.config.scope, data);
	    }else {
	    	this.config.onMessage.call(this.config.scope, data);
	    }
    }

    sendPromise(message){
	    return new Promise((resolve, reject) => {
		    if(!this.connected){
		    	reject({error:'WebSocket not connected! Cannot Send!'});
			    return;
		    }
		    let messageId = this.messageId;
		    if(this.config.stringMessageIdKey){
			    messageId = messageId.toString();
		    }
		    message[this.config.messageIdKey] = messageId;
		    this.messageId++;
		    this.promises[messageId] = {resolve, reject};
		    this.websocket.send(JSON.stringify(message));
	    })
    }

    send(message){
    	if(!this.connected){
		    this.config.onErrorMessage.call(this.config.scope,{error:'WebSocket not connected! Cannot Send!'});
    		return;
	    }
	    let messageId = this.messageId;
	    if(this.config.stringMessageIdKey){
    		messageId = messageId.toString();
	    }
	    message[this.config.messageIdKey] = messageId;
	    this.messageId++;
        this.websocket.send(JSON.stringify(message));
        return messageId;
    }

    close(){
	    this.conenctRetry = false;
	    this.websocket.close();
    }
}

