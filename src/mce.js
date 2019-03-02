
;(function (win,doc) {
	
	var VERSION = '1.0',modules = {},config = {
			maxLoadTotal: 1000,
			pollLoadTime: 3
		}
		 // 是否为undefined
		, isUndefined = function (ufe) {
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
		  	 return object != null && typeof object == 'object';
		}
		// 是否为空
		, isEmpty = function (instance) {
			return isString(instance) ? instance.replace(/(^s*)|(s*$)/g, "").length == 0 
			  		 : isUndefined(instance) || instance == null;
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
		, error = function (method,message) {
			 var error = "Mce: " + "[" + method +"] to " + message;
		  	 throw new Error(error);
		}
		, Mce = function () {
			this.version = VERSION;
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
				document.head.appendChild(script);
				return self.setStatus("loading");
			};
			return {
				create: function (name,src) {
					return new Module(name,src);
				}
			}
	})();

	Mce.prototype.module = function (module) {
		if (!isObject) error("mce.module","module is not object");
		for (var i in module) {
			modules[i] = module[i];
		}
		return this;
	};

	Mce.prototype.define = function(name,resolve,deeps,reject) {
		var deeps = isArray(deeps) ? deeps : [deeps]
		 ,  self  = this;

		self.use(deeps,function () {
			if (!self[name]) {
				self[name] = resolve.call(self,self);
			}
		},reject);
	};

	Mce.prototype.use = function (module,resolve,reject) {
		var module = isArray(module) ? module : [module]
		  , self    = this
		  , apps 	= [];
		module.forEach(function (module) {
			if (!self[module] && !isUndefined(module)) {
				apps.push({
					total: 0,
					module: Module.create(module,modules[module]).load()
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
	win.mce = new Mce();
})(window,document);