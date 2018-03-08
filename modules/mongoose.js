var mongoose = require('mongoose');
var config = require('../config');
mongoose.Promise = global.Promise;
var url = config.mongoDB;
mongoose.connect(url);
module.exports = mongoose;