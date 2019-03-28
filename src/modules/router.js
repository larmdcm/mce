
mce.define(function (exports) {
	var Router = function () {
	   	 	this.v       = '1.0';
	   	 	this.hash 	 = '/';
	   	 	this.query   = {};
	   	 	this.params  = {};
	   	 	this.routes	 = [];
	   	 	this.history = [];
	   	 	this.historyState = 'forward';
	   	 	this.defaultPath  = '/';
	   	 	this.beforeFn = null;
	   	 	this.afterFn  = null;
	   	 	this.redirectFoundUrl = '/';
	   	 	this.view = null;
	   	 	this.viewKey = 'viewId';
	   }
	   , toolFn  = this.toolFn
	   , cache   = {}
	   , storage = {
	   	  sessionGet: function (sessionKey) {
	   	  	 var data = window.sessionStorage.getItem(sessionKey);
	   	  	 return JSON.parse(data || "[]");
	   	  },
	   	  sessionSet: function (sessionKey,data) {
	   	  	 return window.sessionStorage.setItem(sessionKey,JSON.stringify(data));
	   	  }
	   }
	   , pathParse = {
	   	 parsePathKeys: function (path) {
	   	 	var reg  	 = new RegExp(":(\\w+)\/?",'g')
	   	 	 , paramKeys = [];
	   	 	if (reg.test(path)) {
		   	 	mce.each(path.match(reg),function (item) {
		   	 		paramKeys.push(item.replace(':','').replace('/',''));
		   	 	});
		   	 	path = path.replace(reg,"");
		   	 	path = path.substr(-1) == '/' ? path.substr(0,path.length - 1) : path
	   	 	}
	   	 	return {
	   	 		path: path,
	   	 		paramKeys: paramKeys
	   	 	};
	   	 },
	   	 validator: {
	   	 	
	   	 },
	   	 parsePathValues: function (path,route,paramKeys) {
	   	 	var paths = path.split('/').filter(function (path) { return path != ""; })
	   	 	  , routePaths = route.path.split('/').filter(function (path) { return path != ""; })
	   	 	  , length = paths.length
	   	 	  , values = []
	   	 	  , params = {}
	   	 	  , exec   = function (callback) {
		   	 	for (var i = 0; i < paramKeys.length; i++) {
		   	 		var index = length - i;
		   	 		callback(index);
		   	 	}
	   	 	  };

	   	 	if (length <= paramKeys.length) {
	   	 		return false;
	   	 	}
	   	 	mce.each([function (index) {
	   	 		values.push(paths[index - 1]);
	   	 	},function (index) {
		   	 	paths.splice(index - 1,1);
	   	 	}],function (callback) {
	   	 		exec(callback);
	   	 	});
	   	 	if (paths.length != routePaths.length || routePaths.join('/') !== paths.join('/')) {
	   	 		return false;
	   	 	}
	   	 	values = values.reverse();
	   	 	for (var i = 0; i < values.length; i++) {
	   	 		params[paramKeys[i]] = values[i];
	   	 	}
	   	 	return {
	   	 		path: path,
	   	 		params: params
	   	 	}
	   	 }
	   }
	   , config  = {
	   	  defaultExt: '.html',
	   	  basePath: ''
	   }
	   , linkTo = function (url,params) {
	   	  var urls 	   = url.split("?")
	   	    , linkUrl  = urls[0]
	   	    , queryStr = urls.length > 1 ? urls[1] : ""
	   	    , query    = {}
	   	    , params   = params || {};
	   	   if (queryStr.trim().length > 0) {
	   	   	  query = this.__parseParams(queryStr);
	   	   }
	   	   if (toolFn.isObject(this.view)) {
	   	   	   query[this.viewKey] = toolFn.getGuid();
	   	   }
	   	   query = toolFn.merge(params,query);
	   	   location.hash = "#/" + linkUrl + "?" + toolFn.queryToString(query);
	   };

	// 初始化操作
	Router.prototype.init = function () {
		var initEvent = ['load','hashchange'];
		for (var i in initEvent) {
			window.addEventListener(initEvent[i],this.__refresh.bind(this),false);
		}
		window['linkTo'] = linkTo.bind(this);
		this.__refresh.call(this);
		return this;
	};

	Router.prototype.createView  = function (view) {
		this.view = view;
		return this;
	}

	Router.prototype.route = function (path,callback,options) {
		var self    = this
		  , options = options || {};

		if (toolFn.isNull(callback)) {
			toolFn.isArray(path) && mce.each(path,function (item) {
				var itemPathParseResult = pathParse.parsePathKeys(item.path);

				item.path = itemPathParseResult.path;
				item.pathParamKeys = itemPathParseResult.paramKeys;

				if (options.prefix) {
					var itemPrefixParseResult = pathParse.parsePathKeys(options.prefix);
					options.prefix = itemPrefixParseResult.path;
					item.path = options.prefix + "/" + item.path;
				}
				if (item.children) {
					self.route(item.children,null,{
						prefix: item.path
					});
				}
				self.routes.push(item);
			});
		} else {
			var pathParseResult = pathParse.parsePathKeys(path);
			path = pathParseResult.path;
			if (options.prefix) {
				var prefixParseResult = pathParse.parsePathKeys(options.prefix);
				options.prefix = prefixParseResult.path;
			}
			self.routes.push({
				path: options.prefix ? options.prefix + path : path,
				pathParamKeys: pathParseResult.paramKeys,
				callback: callback
			});
		}
		return self;
	};
	
	Router.prototype.before = function (callback) {
		this.beforeFn = callback;
		return this;
	};

	Router.prototype.after = function (callback) {
		this.afterFn = callback;
		return this;
	};

	Router.prototype.redirectFound = function (url) {
		this.redirectFoundUrl = url;
		return this;
	};

	Router.prototype.__refresh = function () {
		var self = this
		  , params = self.__getParams()
		  , sessionKey = "mce-history-route-view"
		  , state = {
		  	back: false,
		  	refresh: false,
		  	forward: false
		  }
		  , index  	  = 0
		  , length    = 0
		  , isFound   = true;
		 self.hash 	  = params.path;
		 self.query   = params.query;

		 if (toolFn.isObject(self.view)) {
			 self.history = storage.sessionGet(sessionKey);

			 length = self.history.length;

			 for (var i = 0; i < length; i++) {
			 	var history = self.history[i];
			 	index = i;
			 	if (history.path == self.hash && history.viewKey == self.query[self.viewKey]) {
			 		i == length - 1 ? state.refresh = true : state.back = true;
			 		break;
			 	} else {
			 		state.forward = true;
			 	}
			 }

			 if (state.refresh) {
			 	self.historyState = "refresh";
			 	self.history.length = index + 1;
			 } else if (state.back) {
			 	self.historyState = "back";
			 } else {
			 	self.historyState = "forward";
			 	self.history.push({
			 		path: self.hash,
			 		query: self.query,
			 		viewKey: self.query[self.viewKey]
			 	});
			 }
			 storage.sessionSet(sessionKey,self.history);
		 }


		 mce.each(self.routes,function (route) {
		 	 
		 	 var path = "/" + (route.path.substr(0,1) == '/' ? route.path.substr(1,route.path.length) : route.path)
		 	  , parsePathResult = {};

		 	 if (route.pathParamKeys.length > 0) {
		 	 	var pathParamKeys   = route.pathParamKeys;
		 	 	parsePathResult = pathParse.parsePathValues(self.hash,route,pathParamKeys)
		 	 	if (parsePathResult == false) return;
		 	 	path = parsePathResult.path;
		 	 }

		 	 if (path != self.hash) {
		 	 	 return;
		 	 }
		 	 if (parsePathResult.params) {
		 	 	self.params = parsePathResult.params;
		 	 }
		 	 if (toolFn.isFunction(self.beforeFn)) {
		 	 	self.beforeFn.call(self,{
		 	 		path: self.hash,
	 	 			query: self.query
		 	 	},self.__exec.bind(self,route));
		 	 } else {
		 	 	self.__exec(route);
		 	 }
		 	 return isFound = false;
		 });

		 if (isFound) {
		 	location.hash = self.redirectFoundUrl;
		 }
	};

	Router.prototype.__exec = function (route) {
		 var self = this;
		 if (!toolFn.isUfe(route.redirect)) {
		 	return route.redirect.indexOf("#") != -1 ? location.hash = route.redirect : location.href = route.redirect;
		 }
		 if (!toolFn.isUfe(route.callback) && toolFn.isFunction(route.callback)) {
	 	 	 var result = route.callback.call(this);
	 	 	 return result;
	 	 }
		 self.afterFn && toolFn.isFunction(self.afterFn) && self.afterFn.call(self);
	}

	Router.prototype.dispatch = function (routes) {
		routes && this.route(routes,null);
		return this.init();
	};

	// 获取路由参数
	Router.prototype.__getParams = function () {
		var hash = location.hash.split('#')[1]
		  , path    = !toolFn.isUfe(hash) ? hash.split('?')[0] : this.defaultPath
		  , query  = this.__parseParams(!toolFn.isUfe(hash) ? hash.split('?').length > 1
		  								 ? hash.split('?')[1] : '' : '');
		return {path: path,query: query};
	};

	// 解析路由参数
	Router.prototype.__parseParams = function (param) {
		 if (toolFn.isEmpty(param)) return [];
		 var params = param.split('&')
		   , query  = {};
		 for (var i in params) {
		 	 var item  = params[i]
		 	   , items = item.split('=');
		 	 items.length > 1 ? query[items[0]] = decodeURI(items[1]) : '';
		 }
		 return query;
	};

	exports('router',new Router());
});