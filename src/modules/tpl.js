
mce.define("tpl",function () {
	var VERSION = '1.0'
	  , toolFn  = this.toolFn
	  , Tpl = function () {
	  	  this.version = VERSION;
	  	  this.el 		= {};
	  	  this.data 	= {};
	  	  this.methods 	= {};
	  	  this.leftTag  = '{{';
	  	  this.rightTag = '}}';
	  }
	  , tplDirectiveStart = "m-"
	  , tplDirectives = {
	  	 text: tplDirectiveStart + "text",
	  	 html: tplDirectiveStart + "html",
	  	 for: tplDirectiveStart + "for",
	  	 bind: tplDirectiveStart + "bind",
	  	 on: tplDirectiveStart + "on"
	  }
	  , tplUtil = {
	  	replaceElement: function (el,fragment) {
	  		var parent = el.parentNode;
	  		parent && parent.replaceChild(fragment,el)
	  	},
	  	getData: function (key,data,el) {
	  		var value;
	  		if (key.indexOf(".") !== -1) {
	  			var keys = key.split(".")
	  			  , tKey = keys.shift();
	  			return tplUtil.getData(keys.join('.'),data[tKey],el)
	  		} else {
	  			value = data[key];
	  		}
	  		if (toolFn.isUfe(value)) {
	  			return compileError("mce.tpl.var","compile error template var " + key + " is undefined",el);
	  		}
	  		return data[key];
	  	}
	  }
	  , tplDirectiveHandles = {
	  	html: function (el,data,value,name) {
	  		el.innerHTML = tplUtil.getData(value,data,el);
	  		el.removeAttribute(name);
	  	},
	  	text: function (el,data,value,name) {
	  		el.textContent = tplUtil.getData(value,data,el);
	  		el.removeAttribute(name);
	  	},
	  	bind: function (el,data,value,name) {
	  		var attrs = name.split(":")
	  		  , attr;
	  		if (attrs.length <= 1) {
	  			return compileError("mce.tpl.bind","for compile error "+ tplDirectives.bind + ":key bind key is error",el);
	  		}
	  		attr = attrs[1];
	  		el.setAttribute(attr,tplUtil.getData(value,data,el));
	  		el.removeAttribute(name);

	  	},
	  	on: function (el,data,value,name) {
	  		var attrs = name.indexOf(":") != -1 ? name.split(":") : name.split("@")
	  		  , attr;
	  		if (attrs.length <= 1) {
	  			return compileError("mce.tpl.on","for compile error "+ tplDirectives.on + ":event on event is error",el);
	  		}
	  		event = attrs[1];
	  		el.addEventListener(event,this.methods[value] && toolFn.isFunction(this.methods[value]) && this.methods[value].bind(this),false);
	  		el.removeAttribute(name);
	  	},
	  	for: function (el,data,value) {
	  		var self	  = this
	  		  , fragment  = document.createDocumentFragment()
	  		  , reg       = /(\((\w+),(\w+)\)|(\w+))\s?in\s?(\w+)/
	  		  , matchs;
	  		if (!value.match(reg)) return compileError("mce.tpl.for","for compile error "+ tplDirectives.for +"=" + '"' + value + '"',el);

	  		matchs = reg.exec(value);
	  		if (matchs.length >= 6 && matchs[5]) {
	  			data[matchs[5]].forEach(function (item,index) {
	  				var data = {}
	  				  , node = el.cloneNode(true);
	  				if (toolFn.isUfe(matchs[4])) {
	  					data[matchs[3].trim()] = index;
	  					data[matchs[2].trim()] = item;
	  				} else {
	  					data[matchs[1].trim()] = item;
	  				}
	  				node.removeAttribute(tplDirectives.for);
	  				self.__compile(node,toolFn.merge(data,self.data));
	  				fragment.appendChild(node);
	  			});
	  			tplUtil.replaceElement(el,fragment);
	  		}
	  	}
	  }
	  , isTextElement = function (element) {
	  	 return element.nodeType === 3;
	  }
	  , isElement = function (element) {
	  	return element.nodeType === 1;
	  }
	  , isDirective = function (attr) {
	  	 return attr.indexOf(tplDirectiveStart) == 0;
	  }
	  , compileError = function (method,message,element) {
	  	 var template = "";
	  	 console.log(element.innerHTML);
	  	 if (element) {
	  	 	template = element.parentNode ? element.parentNode.innerHTML || element.parentNode.textContent : element.innerHTML || element.textContent;
	  	 	message  = message + "\r\ntemplate: \r\n " + template;
	  	 }
	  	 return toolFn.error(method,message)
	  }
	  , isBindDriective = function (attr) {
	  	 return attr.substr(0,1) == ':';
	  }
	  , isEventDirective = function (attr) {
	  	 return attr.substr(0,1) == '@';
	  };

	  Tpl.prototype.render = function(options) {
	  	 this.el 	  = toolFn.isString(options.el) ? document.querySelector(options.el) : options.el;
	  	 this.data 	  = options.data || {};
	  	 this.methods = options.methods || {};
	  	 this.__compile(this.el,this.data);
	  };

	  Tpl.prototype.__compile = function(el,data) {
	  	  var self = this;
	  	  if (isTextElement(el)) {
	  	  	self.__compileTextElement(el,data);
	  	  } else {
	  	  	self.__compileNodeElement(el,data);
	  	  	if (el.hasAttribute(tplDirectives.for)) {
	  	  		return;
	  	  	}
	  	  	if (el.childNodes && el.childNodes.length > 0) {
	  	  		[].slice.call(el.childNodes).forEach(function (el) {
	  	  			self.__compile(el,data);
	  	  		});
	  	  	}
	  	  }
	  };
	  Tpl.prototype.__compileTextElement = function(el,data) {
	  	  var reg = /\{\{(.*?)\}\}/g
	  	    , match
	  	    , normalText
	  	    , content = el.textContent
	  	    , lastIndex = 0
	  	    , element
	  	    , fragment  = document.createDocumentFragment();
	  	  if (!content.match(content)) return;
	      while(match = reg.exec(content)){
            if(match.index > lastIndex){
                //普通文本
                normalText = content.slice(lastIndex,match.index);
                element = document.createTextNode(normalText);
                fragment.appendChild(element);
            }
            lastIndex = reg.lastIndex;
            //占位符
            var exp = match[1].trim();
            element = document.createTextNode(' ');
            element.textContent = tplUtil.getData(exp,data,element);
            fragment.appendChild(element);
        }
        if(lastIndex < content.length){
            //剩余的普通文本
            normalText = content.slice(lastIndex);
            element = document.createTextNode(normalText);
            fragment.appendChild(element);
        }

        tplUtil.replaceElement(el,fragment);
	  };
	  Tpl.prototype.__compileNodeElement = function(el,data) {
	  	  var self   = this
	  	     , attrs = el.attributes;
	  	  if (el.hasAttribute(tplDirectives.for)) {
	  	  	  var handle = tplDirectives.for.substr(2);
	  	  	  return tplDirectiveHandles[handle] && tplDirectiveHandles[handle].call(self,el,data,el.getAttribute(tplDirectives.for));
	  	  }
	  	  [].slice.call(attrs).forEach(function (attr) {
	  	  	  var name = attr.name
	  	  	    , value = attr.value;
	  	  	  if (isDirective(name)) {
	  	  	  	 var handle = name.substr(2);
	  	  	  	 if (handle.indexOf(":") !== -1) {
	  	  	  	 	handle = handle.split(":")[0];
	  	  	  	 }
	  	  	  	 tplDirectiveHandles[handle] && tplDirectiveHandles[handle].call(self,el,data,value,name);
	  	  	  } else if (isBindDriective(name)) {
	  	  	  	 tplDirectiveHandles.bind.call(self,el,data,value,name)
	  	  	  } else if (isEventDirective(name)) {
	  	  	  	 tplDirectiveHandles.on.call(self,el,data,value,name)
	  	  	  }
	  	  });
	  };
	return new Tpl;
});