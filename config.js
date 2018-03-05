var config = {};
//Server
config.port = 8000;
//MQTT Broker
config.mqttPort = 1883;
//Authentication
config.auth = false;

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
config.secretKey = 'gemtektoken';
//Mongo Database
config.mongoDB = 'mongodb://localhost/agri';
config.test_mongoDB = 'mongodb://210.242.93.31/agri';
//Pagination
config.paginate = true;
config.page_limit = 10;
config.sort = 'desc';
//Zone
config.timezone = "Asia/Taipei";
//Debug
config.debug = false;
config.isLocalDB = true;
module.exports = config;