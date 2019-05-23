/**
 *  author: larmdcm
 *  date:2019.3.8
 *  remark:js 异步请求模块
 */

mce.define(function (exports) {
	"use strict";
	var  VERSION = '1.0'
	   , toolFn  = this.toolFn
	   , config  = {
		   	  url: location.href,
	        type: "GET",           
	        async: true,           
	        contentType: "application/x-www-form-urlencoded; charset=UTF-8",   
	        timeout: null,        
	        dataType: '',
	        success: function(){},
	        error: function(){},
	        complete: function(){},
	   }
	   , Request = function () {
	   	  this.version = VERSION;
   	  }
   	  , processOptions = function (options) {

   	  	var optionsNew = {};

        optionsNew = toolFn.merge(options,config);

        optionsNew.data = urlStringify(optionsNew.data);

        optionsNew.type = optionsNew.type.toUpperCase();

        if( optionsNew.type === 'GET' ) {
            if (!toolFn.isEmpty(optionsNew.data)) {
                optionsNew.url += '?' + optionsNew.data;
                optionsNew.data = null;
            }
        }

        return optionsNew;
   	  }
   	  , urlStringify = function (data) {
   	  	
   	  	var result = '', key;
   	  	
        if (toolFn.isString(data)) {
        	return data;
        }
        if (data.toString() === "[object FormData]") {
        	return data;
        }
        if(!toolFn.isObject(data)) {
            return result;
        }
        return toolFn.queryToString(data);
   	  };
   	Request.prototype.ajax = function(options) {

   		var optionsNew, xhr, result, timer;

        optionsNew = processOptions(options);

        xhr = new XMLHttpRequest();
        xhr.open( optionsNew.type, optionsNew.url,optionsNew.async);

        if(optionsNew.type === 'POST') {
            xhr.setRequestHeader('Content-Type', optionsNew.contentType);
        }
        
        if (optionsNew.header && toolFn.isObject(optionsNew)) {
            for (var k in optionsNew.header) {
                 xhr.setRequestHeader(k,optionsNew.header[k]);
            }
        }

        xhr.onreadystatechange = function() {

            if(xhr.readyState === 4) {

                clearTimeout(timer);

                toolFn.isFunction(optionsNew.complete) && optionsNew.complete();
                // (xhr.status >= 200 && xhr.status < 300) || xhr.status === 304 || xhr.status === 400
                if(xhr.status !== 500) {
                    switch ( optionsNew.dataType ) {
                        case 'JSON':
                            result = JSON.parse(xhr.responseText);
                            break;
                        case 'script':
                            eval(xhr.responseText);
                            result = xhr.responseText;
                            break;
                        case 'style':
                            result = xhr.responseText;
                            var style = document.createElement("style");
                            style.innerHTML = result;
                            document.getElementsByTagName('head')[0].appendChild(style);
                            break;
                        default:
                            if (xhr.getResponseHeader('content-type') && xhr.getResponseHeader('content-type').indexOf("application/json") != -1) {
                              result = JSON.parse(xhr.responseText);
                            } else {
                              result = xhr.responseText;
                            }
                            break;
                    }
                    toolFn.isFunction(optionsNew.success) && optionsNew.success(result);
                }else {
                    toolFn.isFunction(optionsNew.error) && optionsNew.error(xhr.status);
                }
            }
        };

        if(optionsNew.timeout) {
            timer = setTimeout(function() {
                optionsNew.error('超时');
                xhr.onreadystatechange = null;
            }, optionsNew.timeout);
        }

        xhr.send(optionsNew.data);
   	};
   	Request.prototype.post = function (url,data,callback) {
   		return this.ajax({
   			url: url,
   			type: "POST",
   			data: data,
   			success: callback 
   		});
   	};
   	Request.prototype.get = function (url,data,callback) {
   		return this.ajax({
   			url: url,
   			type: "GET",
   			data: data,
   			success: callback
   		});
   	};
	exports('request',new Request());
});