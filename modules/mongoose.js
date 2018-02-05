var mongoose = require('mongoose');
var config = require('../config');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/' + config.mongoDB);
module.exports = mongoose;