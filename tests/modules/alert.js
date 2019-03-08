mce.define("alert",function () {
	console.log("我是alert模块我加载了并且依赖了test模块")
	return function (content) {
		console.log(content)
	}
},['test']);