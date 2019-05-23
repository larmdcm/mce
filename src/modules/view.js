/**
 *  author: larmdcm
 *  date:2019.3.28
 *  remark:视图模块
 */

mce.define(function (exports) {
	"use strict";
	var View = function () {
		this.version = '1.0';
		window['view'] = view.bind(this);
	}
	, view = function (options) {
		return this.change(options);
	}
	, toolFn = this.toolFn
	, config = {
		animation: "slide",
		pageCurrent: ".page-current",
		routerPage: ".router-page",
		routeView: "mce-route-view",
		cacheView: false,
		defaultViewExt: "",
		pageContent: ".router-page-content"
	}
	, hasPageCurrentClass = function (className) {
		var cls = config.pageCurrent.substr(1);
		return new RegExp(' ' + cls + ' ').test(' ' + className + ' ');
	}
	, cache = {
		views: {}
	};

	View.prototype.change = function (options) {
		var enterName = "enter-" + config.animation
		  , leaveName = "leave-" + config.animation
		  , historyState = mce.router.historyState
		  , routerPages	 = document.querySelectorAll(config.routerPage)
		  , routerPage   = null
		  , previousPage = document.querySelector(config.pageCurrent)
		  , pageOneClassName = '';

		 if (!routerPages) {
		 	return false;
		 }
		 pageOneClassName = routerPages[0].className;
		 
		 if (routerPages.length <= 1) {
		 	routerPages[0].parentNode.appendChild(routerPages[0].cloneNode(true));
		 }
		 if (!hasPageCurrentClass(pageOneClassName)) {
		 	routerPage = routerPages[0]; 
		 } else {
		 	routerPage = routerPages[1];
		 }

		if (historyState == 'back') {
			routerPage.classList.add(config.pageCurrent.substr(1));
			if (previousPage) {
                previousPage.classList.add(leaveName);
            }
            setTimeout(function() {
                if (previousPage) {
                    previousPage.classList.remove(leaveName);
                    previousPage.classList.remove(config.pageCurrent.substr(1));
                }
            }, 300);
		} else if (historyState == 'forward' || historyState == 'refresh') {
		   if (previousPage) {
               previousPage.classList.add(config.pageCurrent.substr(1));
            }
            routerPage.classList.add(enterName);
            setTimeout(function() {
                if (previousPage) {
                    previousPage.classList.remove(config.pageCurrent.substr(1));
                }
                routerPage.classList.remove(enterName);
                routerPage.classList.add(config.pageCurrent.substr(1));
            }, 300);
            routerPage.scrollTop = 0
		}
		 var render = function (routerPage,template) {
			var elemt = document.createElement('div')
			 , scripts
			 , scriptAppends = [];
		 	elemt.innerHTML = template;
		 	elemt.classList.add(config.routeView);
		 	scripts = elemt.getElementsByTagName('script');
		 	if (scripts.length > 0) {
		 		toolFn.arrSlice(scripts).forEach(function (script) {
		 			if (script.type && (script.type.indexOf("template") != -1 || script.type.indexOf("Template") != -1)) {
		 				return false;
		 			}
			 		var scriptContent = script.innerHTML;
			 		elemt.removeChild(script);
			 		(function (scriptContent) {
			 			var script = document.createElement('script');
			 			script.type = 'text/javascript';
			 			script.innerHTML = scriptContent;
			 			scriptAppends.push(script);
			 		})(scriptContent);
		 		});
		 	}
	 		scriptAppends.forEach(function (script) {
	 			elemt.appendChild(script);
	 		});
	 		routerPage.querySelector(config.pageContent).appendChild(elemt);
		 }
		 , cacheViewFn = function (viewPath,template) {
		 	cache.views[viewPath] = template;
		 };
		routerPage.querySelector(config.pageContent).innerHTML = "";
		if (options.template) {
			render(routerPage,options.template);
		} else if (options.url && toolFn.isString(options.url)) {
			var viewPath = options.url + config.defaultViewExt;
			if (!toolFn.isUfe(options.cacheView)) {
				if (cache.views[viewPath]) {
					return render(routerPage,cache.views[viewPath]);
				}
			} else if (config.cacheView) {
				if (cache.views[viewPath]) {
					return render(routerPage,cache.views[viewPath]);
				}
			}
			mce.use("request",function () {
				var request  = this.request;
				options.data = options.data || {};
				request.get(viewPath,options.data,function (response) {
					if (!toolFn.isUfe(options.cacheView)) {
						cacheViewFn(viewPath,response);
					} else if (config.cacheView) {
						cacheViewFn(viewPath,response);
					}
					render(routerPage,response);
				});
			});
		} else if (options.callback) {
			options.callback.call(this,function (template) {
				render(routerPage,template);
			})
		}
	
	};

	View.prototype.config = function (configs) {
		config = toolFn.merge(configs,config);
		return this;
	};
	exports("view",new View());
});