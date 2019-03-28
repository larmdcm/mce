/**
 * Author: mdcm
 * Data: 2019.3.3
 * Remark: To write JS code More Succinctly and Efficiently
 */

;(function (win,doc,compatible) {
	"use strict";
	var VERSION = '1.0',config = {
			maxLoadTotal: 1000,
			pollLoadTime: 3,
			defaultLoadExt: "js"
		}
		,modules = {
			tpl: "modules/tpl",
			request: "modules/request",
			form: "modules/form",
			router: "modules/router",
			view: "modules/view"
		}
		 // 是否为undefined
		, isUfe = function (ufe) {
		  	return typeof ufe == 'undefined' || ufe === undefined;
		}
		// 是否为数组
		, isArray  = function (array) {
		  	 return array  instanceof Array;
		}
		// 是否为字符串
		, isString = function (string) {
		  	 return typeof string == 'string';
		}
		  // 是否为函数
		, isFunction = function (fn) {
			 return (
		  		  !!fn && !fn.nodename 
		  		  && fn.constructor != String 
		  		  && fn.constructor != RegExp 
		  		  && fn.constructor != Array 
		  		  && /function/i.test(fn + "")
		  	);
		}
		  // 是否为对象
		, isObject = function (object) {
		  	 return !isNull(object) && typeof object == 'object';
		}
		// 是否为空
		, isEmpty = function (value) {
			if (isUfe(value)) {
				return true;
			}
			if (isString(value)) {
				return value.trim().length <= 0;
			}
			if (isObject(value)) {
				for (var key in value) {
					return false;
				}
				return true;
			}
			if (isArray(value)) {
				return value.length <= 0;
			}
			return false;
		}
		// 是否为整数
		, isInteger = function (integer) {
		  	return /^[0-9]*[1-9][0-9]*$/.test(integer);
		}
		// 是否为null
		, isNull  = function (val) {
		  return val === null;
		}
		// 是否为布尔值
		, isBoolean = function (bool) {
		  	 return typeof bool == 'boolean';
		}
		, getBasePath = function () {
			var scripts  = arrSlice(document.scripts).filter(function (script) {
			  	  var src = script.src;
			  	  return src.indexOf("mce") !== -1;
			  })
			  , path = scripts.length <= 0 ? "" : scripts[0].src;
			  return path.substring(0, path.lastIndexOf('/') + 1);
		}
		, getGuid = function () {
			 var S4 = function () {
	           return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	         };
	         return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
		}
	   , queryToString = function (data) {
	   	  var queryStr = '';
	   	  for (var key in data) {
	   	  	 queryStr += window.encodeURIComponent(key) + '=' + window.encodeURIComponent(data[key]) + '&';
	   	  }
	   	  return queryStr.slice(0,-1);
	   }
		, error = function (method,message) {
			 var error = "Mce: " + "[" + method +"] to " + message;
		  	 throw new Error(error);
		}
		, merge = function (newObj,oldObj) {
			(!isObject(newObj) || !isObject(oldObj)) && error("mce.merge","merge object error newObj or oldObj not is a object");
			for (var k in newObj) {
				oldObj[k] = newObj[k];
			}
			return oldObj;
		}
		, arrSlice = function (object) {
			return Array.prototype.concat.apply([],object).slice();
		}
		, printf = function () {
			var str = arguments[0];
			for (var i = 1; i < arguments.length; i++) {
				str = str.replace(new RegExp('\\{' + (i - 1) +'\\}','g'),arguments[i]);
			}
			return str;
		}
		, Mce = function () {
			this.version  = VERSION;
			this.basePath = getBasePath();
			this.toolFn   = {
				isObject: isObject,
				isUfe: isUfe,
				isFunction: isFunction,
				isArray: isArray,
				isString: isString,
				isInteger: isInteger,
				isEmpty: isEmpty,
				isNull: isNull,
				printf: printf,
				merge: merge,
				getGuid: getGuid,
				queryToString: queryToString,
				arrSlice: arrSlice,
				error: error
			};
		}
		, Module = (function () {

			function Module (name,src) {	
				this.name    = name;
				this.src 	 = src;
				this.status  = 'wait';
			}
		
			Module.prototype.setStatus = function(status) {
				this.status = status;
				return this;
			};

			Module.prototype.load = function() {
				var script = document.createElement("script")
				  , self   = this;
				script.src = this.src;
				script.onload = script.onreadystatechange = function () {
					if (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete') {
			  	  		self.setStatus("complete");
			  	  	}
				};
				document.getElementsByTagName('head')[0].appendChild(script);
				return self.setStatus("loading");
			};
			return {
				create: function (name,src) {
					return new Module(name,src);
				}
			}
	})();
	
	Mce.prototype.each = function (items,callback) {
		var result;
		for (var i in items) {
        	 result = callback.call(this,items[i],i,items[i]);
             if (isBoolean(result) && result === false) break; 
        }
        return isUfe(result) ? true : result;
	};

	Mce.prototype.config = function (configs) {
		config = merge(configs,config);
		return this;
	};

	Mce.prototype.module = function (module) {
		modules = merge(module,modules);
		return this;
	};

	Mce.prototype.define = function(resolve,deeps,reject) {
		 var self  = this
		 ,  load   = function (resolve) {
		 	var self = this;
		 	resolve.call(self,function (name,module) {
				if (!self[name]) {
					self[name] = module;
				}
			});
		 };
		if (isFunction(resolve)) {
			return load.call(self,resolve);
		}
		self.use(resolve,function () {
			load.call(self,deeps);
		},reject);
	};

	Mce.prototype.use = function (module,resolve,reject) {
		var module = isArray(module) ? module : [module]
		  , self    = this
		  , apps 	= [];
		module.forEach(function (module) {
			if (!self[module] && !isUfe(module) && modules[module]) {
				var src = self.basePath + modules[module] + ".js";
				apps.push({
					total: 0,
					module: Module.create(module,src).load()
				});
			}
		});
		function isLoad (apps) {
			apps.forEach(function (app,index) {
				if (app.module.status === 'complete' && self[app.module.name]) {
					apps.splice(index,1);
				} else {
					app.total++;
				}
				if (app.total >= config.maxLoadTotal) {
					apps.splice(index,1);
					app.module.setStatus("fail");
					reject && isFunction(reject) ? reject.call(self,app) : error("mce.use",app.module.name + " load is error");
				}
			});
			return apps.length <= 0;
		}
		;(function poll (apps,resolve) {
			!isLoad(apps) ? setTimeout(function () {
				poll(apps,resolve);
			},config.pollLoadTime) : resolve.call(self);
		}(apps,resolve));
	}
	compatible(function () {
		return new Mce();
	});
})(window,document,function (factory) {
	if (!Array.prototype.filter) {
		 Array.prototype.filter = function(fun) {
		    "use strict";
		    if (this === void 0 || this === null)   throw new TypeError();

		    var t = Object(this)
		     ,  len = t.length >>> 0;
		    if (typeof fun !== "function")
		      throw new TypeError();

		    var res = [];
		    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
		    for (var i = 0; i < len; i++) {
		      if (i in t) {
		        var val = t[i];
		        if (fun.call(thisArg, val, i, t))
		          res.push(val);
		      	}
		    }
		    return res;
		 }
	}
	if (!Array.prototype.forEach) {
	     Array.prototype.forEach = function forEach( callback, thisArg ) {
	        var T, k;

	        if ( this == null ) {
	            throw new TypeError("this is null or not defined");
	        }
	        var O = Object(this);
	        var len = O.length >>> 0;
	        if ( typeof callback !== "function" ) {
	            throw new TypeError(callback + " is not a function");
	        }
	        if ( arguments.length > 1 ) {
	            T = thisArg;
	        }
	        k = 0;

	        while( k < len ) {
	            var kValue;
	            if (k in O) {
	                kValue = O[ k ];
	                callback.call( T, kValue, k, O );
	            }
	            k++;
	        }
    	};
	}
	window.mce = factory();
});