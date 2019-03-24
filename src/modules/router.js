
mce.define(function (exports) {
	var Router = function () {
	   	 	this.v       = '1.0';
	   	 	this.hash 	 = '/';
	   	 	this.query   = {};
	   	 	this.params  = {};
	   	 	this.routes	 = [];
	   	 	this.history = [];
	   	 	this.historyState = '';
	   	 	this.defaultPath  = '/';
	   	 	this.beforeFn = null;
	   	 	this.afterFn  = null;
	   	 	this.redirectFoundUrl = '/';
	   	 	this.view = null;
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
	   , config  = {
	   	  defaultExt: '.html',
	   	  basePath: ''
	   };

	// 初始化操作
	Router.prototype.init = function () {
		var initEvent = ['load','hashchange'];
		for (var i in initEvent) {
			window.addEventListener(initEvent[i],this.__refresh.bind(this),false);
		}
		this.__refresh.call(this);
		return this;
	};

	Router.prototype.createView  = function (view) {
		// this.view = view;
		return this;
	}

	Router.prototype.route = function (path,callback,options) {
		var self    = this
		  , options = options || {};

		if (toolFn.isNull(callback)) {
			toolFn.isArray(path) && mce.each(path,function (item) {
				if (options.prefix) {
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
			self.routes.push({
				path: options.prefix ? options.prefix + path : path,
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
			 	if (history.path == self.hash) {
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
			 		query: self.query
			 	});
			 }
			 storage.sessionSet(sessionKey,self.history);
		 }


		 mce.each(self.routes,function (route) {
		 	 var path = "/" + (route.path.substr(0,1) == '/' ? route.path.substr(1,route.path.length) : route.path);

		 	 if (path != self.hash) {
		 	 	 return;
		 	 }

		 	 if (toolFn.isFunction(self.beforeFn)) {
		 	 	self.beforeFn.call(self,{
		 	 		path: self.hash,
	 	 			query: self.query
		 	 	},self.__exec.bind(self,route));
		 	 } else {
		 	 	self.__exec(route);
		 	 }
		 	 isFound = false;
		 });

		 if (isFound) {
		 	location.hash = self.redirectFoundUrl;
		 }
	};

	Router.prototype.__exec = function (route) {
		 var self = this;
		 if (!toolFn.isObject(self.view) && !toolFn.isUfe(route.callback) && toolFn.isFunction(route.callback)) {
	 	 	return route.callback.call(this);
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
		   , paramsContainer = [];
		 for (var i in params) {
		 	 var item  = params[i]
		 	   , items = item.split('=');
		 	 items.length > 1 ? paramsContainer[items[0]] = decodeURI(items[1]) : '';
		 }
		 return paramsContainer;
	};

	exports('router',new Router());
});