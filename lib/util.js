'use strict';

const fs = require('fs');

const loadFile = function(file, callback) {
	
	fs.readFile(file, function (err, data) {
  		if (err) {
    		return callback(err);
  		}
  		return callback(null, data)
  	});

};

module.exports.loadFile = loadFile;