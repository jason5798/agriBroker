var config = {};

config.port = 8000;

//Authentication
config.auth = false;

//Myaql Database
config.database = 'cloudb';
config.username = 'admin';
config.password = 'gemtek1234';
config.table_prefix = 'api_';
config.dbHost = '210.242.93.31';
config.dbPort = 3306;
config.secretKey = 'gemtektoken';
//Mongo Database
config.mongoDB = 'agri';
//Pagination
config.paginate = true;
config.page_limit = 10;
//Zone
config.timezone = "Asia/Taipei";
module.exports = config;