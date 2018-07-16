class Ajax{

}

Ajax.request = function(config){
	let conf = {};
	for(let key in Ajax.config){
		if(config.hasOwnProperty(key)){
			conf[key] = config[key];
		}else{
			conf[key] = Ajax.config[key];
		}
	}
	let r = new XMLHttpRequest();
	r.onreadystatechange = function(event) {
		if(r.readyState === XMLHttpRequest.DONE) {
			let jsonData = {};
			try {
				jsonData = JSON.parse(r.response);
			}catch (e) {
				conf.failure.call(conf.scope,conf.jsonError,jsonData);
				return;
			}
			if(r.status === 200){
				conf.success.call(conf.scope,jsonData);
			} else{
				if(jsonData.error){
					conf.failure.call(conf.scope,jsonData.error,jsonData);
				}else{
					conf.failure.call(conf.scope,conf.error,jsonData);
				}
			}
		}
	};
	r.open("POST",conf.url, true);
	for(let key in conf.headers){
		if(conf.headers.hasOwnProperty(key)) {
			r.setRequestHeader(key, conf.headers[key]);
		}
	}

	let postStr = "";
	if(conf.method.toUpperCase() === 'POST'){
		switch(conf.headers['Content-Type']){
			case 'application/x-www-form-urlencoded':
				let postData = [];
				for(let i in conf.params){
					if(conf.params.hasOwnProperty(i)){
						postData.push(encodeURIComponent(i)+"="+encodeURIComponent(conf.params[i]));
					}
				}
				postStr = postData.join("&");
				break;
			case 'application/json':
				postStr = JSON.stringify(conf.params);
				break;
		}
	}
	r.send(postStr);
};

Ajax.config = {
	url:'',
	params:{},
	method:'POST',
	success:function(reply){},
	failure:function(error,reply){console.error(error,reply)},
	scope:this,
	error:"Unknown Server Error!",
	jsonError: "Bad Server Response!",
	headers:{
		'Content-Type':'application/json'
	}
};