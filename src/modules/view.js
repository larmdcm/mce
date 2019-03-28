
mce.define(function (exports) {
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
		routeView: "mce-route-view"
	}
	, hasPageCurrentClass = function (className) {
		var cls = config.pageCurrent.substr(1);
		return new RegExp(' ' + cls + ' ').test(' ' + className + ' ');
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
		if (options.template) {
			var elemt = document.createElement('div');
			toolFn.arrSlice(routerPage.children).forEach(function (node) {
				if (node.classList.contains(config.routeView)) {
					routerPage.removeChild(node);
				}
			});
			elemt.innerHTML = options.template;
			elemt.classList.add(config.routeView);
			routerPage.appendChild(elemt);
		}
	};

	View.prototype.config = function (configs) {
		config = toolFn.merge(configs,config);
		return this;
	};
	exports("view",new View());
});