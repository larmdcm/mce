/**
 *  author: larmdcm
 *  date:2019.5.23
 *  remark:文件上传模块
 */

mce.define(function (exports) {
	"use strict";

	var Upload = function () {
		this.version     = '1.0';
		this.request = mce.request;
		this.btns = {
		};
		this.options = {
			url: location.href,
			auto: false,
			name: "file",
			multiple: false,
			data: {

			},
			validate: {
				rule: {
					size: 0,
					type: "*",
					ext: "*",
				},
				message: {
					size: '文件上传大小超出范围',
					type: '文件上传类型不支持',
					ext: '文件上传后缀不支持',
				},
				error: function () {}
			},
			btns: {
				start: ".mce-upload-start",
			},
			events: {
				selectFile: function () {},
				progress: function () {},
				success: function () {}
			},
			bigDocuments: {
				start: 0,
				length: 1024 * 1024 * 1,
				blobNumName: 'blob_num',
				totalBolbNumName: 'total_blob_num',
				fileName: 'file_name'
			},
			isBigDocuments: false
		};
		this.fileStatus = {};
	}
	, progressCache = {}
	, validator = {
		validExt: function (file,value,error,message) {
			if (value == '*') return true;
			var ext = toolFn.isString(value) ? value.split(',') : value;
			for (var i in ext) {
				if (ext[i] == '*') {
					return true;
				}
				if (ext[i] == file.name.split('.')[file.name.split('.').length - 1]) {
					return true;
				}
			}
			error(message['ext']);
			return false;
		},
		validType: function (file,value,error,message) {
			if (value == '*') return true;
			var type = tool.isString(value) ? value.split(',') : value;
			for (var i in type) {
				if (type[i] == '*') {
					return true;
				}
				if (type[i] == file.type) {
					return true;
				}
			}
			error(message['type']);
			return false;
		},
		validSize: function (file,value,error,message) {
			if (value == 0) return true;
			if (value >= file.size) return true;
			error(message['size']);
			return false;
		}
	}
	, getFileUploadInstance = function (options) {
		var FileUpload = function (options) { 
			this.options = options;
			this.fielUploadXhr = null;
			this.idName = '';
		};
		FileUpload.prototype = {
			send: function () {
				var fileStatus  = this.options.fileStatus
				  , el          = this.options.el
				  , fileOptions = this.options.fileOptions
				  , self = this;
				for (var i = 0; i < fileStatus.fileList.length; i++) {
					var fileUploadXhr = this.fielUploadXhr = this.__createFileUploadXhr(fileOptions)
					 ,  formData = new FormData()
					 ,  file     = fileStatus.fileList[i]
					 , responseCallback = function (response) {
						if (fileUploadXhr.getResponseHeader('content-type') && fileUploadXhr.getResponseHeader('content-type').indexOf("application/json") != -1) {
                           response = JSON.parse(response);
                        }
                        fileOptions.events.success && fileOptions.events.success.call(self,response,fileUploadXhr.status);
					 };
					for (var k in fileOptions.data) {
						formData.append(k,fileOptions.data[k]);
					}
					if (!fileOptions.isBigDocuments) {
						formData.append(el.getAttribute('name'),file);
						fileUploadXhr.onreadystatechange = function () {
							responseCallback(fileUploadXhr.responseText);
							fileOptions.events.progress && fileOptions.events.progress.call(self,100)
						}
					} else {
						var totalBolbNum = Math.ceil(file.size / fileOptions.bigDocuments.length)
						  , idName = el.getAttribute('id') + "_" + i + file.name;

						if (!progressCache[idName]) {
							progressCache[idName] = {};
							progressCache[idName].start   = fileStatus.start;
							progressCache[idName].end     = fileStatus.end;
							progressCache[idName].length  = fileStatus.length;
							progressCache[idName].blobNum = fileStatus.blobNum;
							progressCache[idName].isStop  = fileStatus.isStop;
							progressCache[idName].blob    = this.__cutFile(file,idName);
							this.idName = idName;
						}
						progressCache[idName].fileUploadXhr = fileUploadXhr;
						formData.append(el.getAttribute('name'),progressCache[idName].blob);
						formData.append(fileOptions.bigDocuments.blobNumName,progressCache[idName].blobNum);
						formData.append(fileOptions.bigDocuments.totalBolbNumName,totalBolbNum);
						formData.append(fileOptions.bigDocuments.fileName,file.name);

						fileUploadXhr.onreadystatechange = function () {

							responseCallback(fileUploadXhr.responseText);

							if (totalBolbNum == 1) {
								fileOptions.events.progress && fileOptions.events.progress.call(self,100)
							} else {
								fileOptions.events.progress && fileOptions.events.progress.call(self,(Math.min(100,(
									progressCache[idName].blobNum / totalBolbNum) * 100)
								).toFixed(2));
							}
							setTimeout(function () {
								if (progressCache[idName].start < file.size && progressCache[idName].isStop === false) {
									progressCache[idName].blob = self.__cutFile(file,idName);
									progressCache[idName].blobNum = progressCache[idName].blobNum + 1;
									getFileUploadInstance({
										el: el,
										fileStatus: fileStatus,
										fileOptions: fileOptions
									}).send();
								}
							},1000);
						};
					}
					fileUploadXhr.send(formData);
					if (fileOptions.isBigDocuments) break;
				}
			},
			start: function () {
				progressCache[this.idName].isStop = false;
			    getFileUploadInstance({
					el: this.options.el,
					fileStatus: this.options.fileStatus,
					fileOptions: this.options.fileOptions
				}).send();
			},
			stop: function () {
				progressCache[this.idName].fileUploadXhr.abort();
				progressCache[this.idName].isStop = true;
			},
			__cutFile: function (file,idName) {
				var fileBlob = file.slice(progressCache[idName].start,progressCache[idName].end);
				progressCache[idName].start = progressCache[idName].end;
				progressCache[idName].end   = progressCache[idName].start + progressCache[idName].length;
				return fileBlob;
			},
			__createFileUploadXhr: function (options) {
				var xhr = new XMLHttpRequest();
				xhr.open('POST',options.url,false);
				return xhr;
			}
		};
		return new FileUpload(options);
	}
	, toolFn = this.toolFn;


	Upload.prototype = {
		create: function (options) {
			var options = this.options = toolFn.merge(options || {},this.options)
			 , self     = this;
			self.btns.start = toolFn.isString(options.btns.start) ? document.querySelector(options.btns.start) : options.btns.start;
			var inputFileEl = self.__createInputFile(self.btns.start,options.name,options.multiple);

			inputFileEl.onchange = self.__fileChange.bind({
				el: inputFileEl,
				options: self.options,
				upload: self
			});
			self.fileStatus[inputFileEl.getAttribute('id')] = {
				start: self.options.bigDocuments.start,
				end: self.options.bigDocuments.start + self.options.bigDocuments.length,
				length: self.options.bigDocuments.start + self.options.bigDocuments.length,
				blob: null,
				blobNum: 1,
				isStop: false
			};
			self.btns.start.addEventListener('click',function () {
				inputFileEl.click();
			});
			return getFileUploadInstance({
				el: inputFileEl,
				fileStatus: self.fileStatus[inputFileEl.getAttribute('id')],
				fileOptions: self.options
			});
		},
		__createInputFile: function (el,name,multiple) {
			var inputFile
			 , inputFileEl
			 , inputFileId = toolFn.getGuid()
			 , multiple    = toolFn.isUfe(multiple) ? false : multiple;
			if (inputFileEl = document.getElementById(inputFileId)) {
				return inputFileEl;
			}
			inputFile      = document.createElement('input')
			inputFile.type = 'file';
			inputFile.name = name;
			inputFile.id   = inputFileId;
			inputFile.style.display = 'none';
			if (multiple) {
				inputFile.multiple = multiple;
			}

			el.appendChild(inputFile);
			return document.getElementById(inputFileId);
		},
		__fileChange: function () {
			var self    = this
			  , el      = self.el
			  , options = self.options
			  , upload  = self.upload
			  , fileStatus = upload.fileStatus[el.getAttribute('id')]
			  , fileList   = [];
			 for (var i = 0 ; i < el.files.length; i++) {
				 var file = el.files.item(i);
				 if (options.validate && options.validate.rule) {
				 	var valid = mce.each(options.validate.rule,function (value,rule) {
				 		return (validator["valid" + rule.substring(0,1).toUpperCase() 
				 		+ rule.substring(1)] && validator["valid" + rule.substring(0,1).toUpperCase() 
				 		+ rule.substring(1)](file,value,options.validate.error || function (errormsg) {},options.validate.message));
				 	});
				 	if (!valid) continue;
				 }
				 fileList.push(file);
			 }
			 upload.fileStatus[el.getAttribute('id')].fileList = fileList;
			 options.events.selectFile && options.events.selectFile.call(upload,fileList);
			 if (!options.auto) return;
			 return getFileUploadInstance({
			 	el: el,
			 	fileStatus: upload.fileStatus[el.getAttribute('id')],
			 	fileOptions: options
			 }).send();
		}
	};

	exports('upload',new Upload());
});