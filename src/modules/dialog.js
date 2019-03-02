
mce.define("dialog",function () {
	console.log("我是dialog模块我加载了,并且我依赖了alet模块")
	return {
		alert: function (message) {
			mce.alert(message);
		}
	}
},'alert');