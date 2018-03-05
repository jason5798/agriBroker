var mongoose = require('mongoose');
var config = require('../config');
mongoose.Promise = global.Promise;
var url = config.mongoDB;
if (!config.isLocalDB) {
    url = config.test_mongoDB;
    console.log('connect to mongoDB : ' +  url);
}
mongoose.connect(url);
module.exports = mongoose;