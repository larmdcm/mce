
mce.define(function (exports) {
	var Router = function () {
	   	 	this.v       = '1.0';
	   	 	this.params  = {};
	   	 	this.hashMap = {};
	   	 	this.defaultPath  = '/index';
	   	 	this.routerChange = []; 
	   }
	   , tool   = this.toolFn
	   , cache  = {}
	   , config = {
	   	  defaultExt: '.html',
	   	  basePath: ''
	   };

	// 初始化操作
	Router.prototype.init = function (isCache) {
		var initEvent = ['load','hashchange'];
		for (var i in initEvent) {
			$(window).on(initEvent[i],this.refersh.bind(this));
		}
		this.refersh.call(this);
		return this;
	};

	exports('router',new Router())
});