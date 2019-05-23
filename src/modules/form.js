/**
 *  author: larmdcm
 *  date:2019.3.8
 *  remark:表单验证模块
 */

mce.define(function (exports) {
	"use strict";
	var VERSION = '1.0'
	  , toolFn  = this.toolFn
	  , validator = function () {
	  	return (function () {
	  		function Validator () {}
	  		Validator.prototype = {
	  			register: function (name,fn) {
	  				var self = this;
	  				if (arguments.length == 1 && toolFn.isArray(name)) {
	  					mce.each(name,function (item) {
	  						self[self.getValidMethodName(item.name)] = item.fn;
	  					});
	  				} else {
		  				self[self.getValidMethodName(name)] = fn;
	  				}
	  				return self;
	  			},
	  			hasValidMethod: function (name) {
	  				return this[this.getValidMethodName(name)];
	  			},
	  			getValidMethodName: function (name) {
	  				return "valid" + name.substring(0,1).toUpperCase()+ name.substring(1);
	  			},
	  			validRequired: function (value) {
	  				return !toolFn.isEmpty(value);
	  			},
	  			validBetween: function (value,min,max) {
	  				return value >= min && value <= max;
	  			},
	  			validLength: function (value,min,max) {
	  				var max = max || min;
	  				return value.length >= min && value.length <= max;
	  			},
	  			validMax: function (value,max) {
	  				return value <= max;
	  			},
	  			validMin: function (value,min) {
	  				return value >= min;
	  			},
	  			validMaxLength: function (value,max) {
	  				return value.length <= max;
	  			},
	  			validMinLength: function (value,min) {
	  				return value.length >= min;
	  			},
	  			validEmail: function (value) {
	  				return  /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/.test();
	  			},
	  			validPhone: function (value) {
	  				return  /^((13[0-9])|(14[5,7])|(15[0-3,5-9])|(17[0,3,5-8])|(18[0-9])|166|198|199|(147))\d{8}$/.test(value);
	  			},
	  			validIdNumber: function (value) {
	  				return /^(\d{6})(\d{4})(\d{2})(\d{2})(\d{3})([0-9]|X)$/.test(value);
	  			}
	  		};
	  		return new Validator;
	  	})();
	  }
	  , Form = function () {
	  	 this.validator = validator();
	  	 this.ruleName  = 'valid-rules';
  	 	 this.rules = {
    	      required: '该字段必须填写',
    	      between: '该字段值不在指定范围内',
    	      length: '该字段值长度不在指定范围内',
    	      max: '该字段值超出范围',
    	      min: '该字段值小于范围内',
    	      maxLength: '该字段值长度超出范围',
    	      minLength: '该字段值长度小于范围内',
    	      email: '邮箱格式错误',
    	      phone: '电话号码格式错误',
    	      idNumber: '身份证号格式错误',
         };
	  	 this.validErrorFn = {};
	  	 this.customErrorFn = null;
	  }
	  Form.prototype = {
	  	  valid: function (elemet,batch) {
	  	  	var elemet = elemet || (document.forms.length > 0 ? document.forms[0] : null)
	  	  	  , self   = this
	  	  	  , batch  = toolFn.isUfe(batch) ? false : batch;
	  	  	if (!elemet || elemet.toString() !== '[object HTMLFormElement]') {
	  	  		return toolFn.error('mce.form.valid','elemet is not a FormElement');
	  	  	}
		  	for (var i = 0; i < elemet.length; i++) {
		 	 	  var field  = elemet[i]
		 	 	  	 , rule  = field.getAttribute(self.ruleName);
		 	 	  if (!rule) continue;
		 	 	  var rules = rule.split('|')
	 	 	  	 for (var v = 0; v < rules.length; v++) {
	 	 	  	 	  var value   =  field.value ? field.value.trim() : ''
	 	 	  	 	     , params = rules[v].split(':')
	 	 	  	 	     , method = self.validator.getValidMethodName(params[0])
	 	 	  	 	     , args   = [];
	 	 	  	 	  args = params.length > 1 ? params[1].indexOf(',') ? params[1].split(',') : params[1].split('') : [];
	 	 	  	 	  args.splice(0,0,value);
	 	 	  	 	  if (self.validator[method]) {
			  	 	  	  if (!self.validator[method].apply(self.validator,args)) {
			  	 	  	  	  self.validErrorFn[params[0]] && toolFn.isFunction(self.validErrorFn[params[0]]) 
		  	 	  			? self.validErrorFn[params[0]].apply(self,[field,params[0]])
		  	 	  			: self.validError(field,params[0]);
			  	 	  	  	  if (!batch) {
			  	 	  			  return false;
			  	 	  	  	  }
			  	 	  	  }
	 	 	  	 	  }
	 	 	  	 	  continue;
	 	 	  	 }
		 	}
	  	  	return true;
	  	  },
	  	  register: function (rule,fn,message,errorFn) {
	  	  	var self = this
	  	  	  , register = function (rule,fn,message,errorFn) {
  	  	  		var errorFn = errorFn || null , self = this;
		 		self.rules[rule] = message;
		 		self.validErrorFn[rule] = errorFn;
		 		self.validator.register(rule,fn);
	  	  	  };
	  	  	if (arguments.length == 1 && toolFn.isArray(rule)) {
	  	  		mce.each(rule,function (item) {
	  	  			register.call(self,item.rule,item.fn,item.message,item.errorFn);
	  	  		});
	  	  	} else {
	  	  		register.call(self,rule,fn,message,errorFn);
	  	  	}
	  	  	return this;
	  	  },
	  	  registerValidErrorHandler: function (rule,fn) {
	  	  	var self = this;
	  	  	if (arguments.length == 1 && toolFn.isArray(rule)) {
	  	  		mce.each(rule,function (item) {
	  	  			self.validErrorFn[item.rule] = item.fn;
	  	  		});
	  	  	} else {
	  	  		self.validErrorFn[rule] = fn;
	  	  	}
	  	  },
	  	  validError: function (el,rule) {
	  	   	 var message = el.getAttribute('valid-' + rule) || this.rules[rule];
	  	   	 if (this.customErrorFn != null) {
	  	   	 	return this.customErrorFn.call(this,el,message);
	  	   	 }
	  	   	 alert(message);
	 		 el.focus();
	 		 return false;
	  	  },
	  	  registerCustomError: function (callback) {
	  	  	 this.customErrorFn = callback;
	  	  },
	  	  serialize: function (elemet) {
	  	  	 var params = this.serializeArray(elemet)
	  	  	    , str   = "";
	  	  	  return toolFn.queryToString(params);
	  	  },
	  	  serializeArray: function (elemet) {
	  	  	  var elemet  = elemet || (document.forms.length > 0 ? document.forms[0] : null)
	  	  	     , params = {};
  	  	  	  if (!elemet || elemet.toString() !== '[object HTMLFormElement]') {
	  	  		  return toolFn.error('mce.form.valid','elemet is not a FormElement');
	  	  	  }
			  for (var i = 0; i < elemet.length; i ++) {
					var filed = elemet[i];
					switch (filed.type) {
						case undefined : 
						case 'submit' : 
						case 'reset' : 
						case 'file' : 
						case 'button' : 
							break;
						case 'radio' : 
						case 'checkbox' : 
							if (!filed.selected) break;
						case 'select-one' : 
						case 'select-multiple' :
							for (var j = 0; j < filed.options.length; j ++) {
								var option = filed.options[j];
								if (option.selected) {
									var optValue = '';
									if (option.hasAttribute) {
										optValue = (option.hasAttribute('value') ? option.value : option.text);
									} else {
										optValue = (option.attributes('value').specified ? option.value : option.text);
									}
									params[filed.name] = optValue; 
								}
							}
							break;
						default :
							params[filed.name] = filed.value;
					}
			    }
				return params;
	  	  }
	  };
	exports('form',new Form);
});
