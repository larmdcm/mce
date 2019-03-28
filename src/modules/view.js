
mce.define(function (exports) {
	var View = function () {
		this.version = '1.0';

		window['view'] = view.bind(this);
	}
	, view = function (options) {
		return (function (options) {
			var viewTemplate = new (function ViewTemplate(options) { this.options = options; })(options);
			viewTemplate.prototype = {
				
			};
			return viewTemplate;
		})(options);
	}
	, toolFn = this.toolFn
	, config = {};

	View.prototype.config = function (configs) {
		config = toolFn.merge(configs,config);
		return this;
	};
	return exports("view",new View());
});