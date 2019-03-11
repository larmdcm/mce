/**
 *  author: mdcm
 *  date:2019.3.8
 *  remark:js 异步请求模块
 */

mce.define(function (exports) {
	"use strict";
	var  VERSION = '1.0'
	   , toolFn  = this.toolFn
	   , config  = {
		   	url: location.href,
	        type: "GET",           
	        async: true,           
	        contentType: "application/x-www-form-urlencoded; charset=UTF-8",   
	        timeout: null,        
	        dataType: 'JSON',
	        success: function(){},
	        error: function(){},
	        complete: function(){},
	   }
	   , Request = function () {
	   	  this.version = VERSION;
   	  };
   	Request.prototype.ajax = function(options) {
   		
   	};
   	Request.prototype.post = function () {

   	};
   	Request.prototype.get = function () {

   	};
	exports('request',new Request());
});