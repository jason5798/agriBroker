var config = {};

config.port = 8001;

//Authentication
config.auth = false;

//Base Url
config.baseurl = '/v1/';

//Myaql Database
config.database = 'cloudb';
config.dbHost = 'localhost';
config.test_dbHost = '210.242.93.31';
config.username = 'admin';
config.password = 'gemtek1234';
// config.username = 'root';
// config.password = '12345678';
config.table_prefix = 'api_';
config.dbPort = 3306;
//Key
config.tokenKey = 'gemtektoken';
config.generalKey = 'gemtek';
//Mongo Database
config.mongoDB = 'mongodb://localhost/agri';
config.test_mongoDB = 'mongodb://210.242.93.31/agri';
//Pagination
config.paginate = true;
config.page_limit = 10;
config.sort = 'desc';
//Zone
config.timezone = 'Asia/Taipei';
//Debug
config.debug = true;
config.isLocalDB = true;
//Server
config.server = 'http://localhost:'+ config.port + '/';
//Amqp
config.amqpHost = 'localhost';
config.amqpPort = 5672;
config.login = 'jingdfh-test';
config.password = 'jingdfh-test';
config.vhost = '/jingdfh-test';
config.exchange_name = 'amp.jingdfh-test.forward.exc';
config.qu_name_uldata = 'ul.jingdfh-test.wechat.que';
config.routingKey = 'WeChat';
//MQTT
config.mqttPort = 1883;
module.exports = config;