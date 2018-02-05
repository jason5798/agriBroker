var Sequelize = require('sequelize');
var config = require('../config');

//Initialize database
var sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.dbHost,
    dialect: 'mysql',
    pool: {
        max: 10,
        min: 0,
        idle: 30000
    }
});
var TABLE_PREFIX = config.table_prefix;

module.exports = {
    getData,
    getDevices,
    getHistory,
    getProperties
}

function createData (table, keys, value, callback) {
    sequelize.query("INSERT INTO `" + ( TABLE_PREFIX + req.params.table ) + "` (" + keys + ") VALUES ("+ values +")", { type: sequelize.QueryTypes.INSERT})
		.then(function(id) {
			return callback(null, id);
		})
		.catch( function(err) {
			return callback(err.message);
		});
}

function getData (query, callback) {
    sequelize.query(query, { type: sequelize.QueryTypes.SELECT})
		.then(function(rows) {
			return callback(null, rows);
		})
		.catch( function(err) {
            return callback(err.message);
		});
}

function getDevices (mac, callback) {
    var read_query = "SELECT * FROM `" + ( TABLE_PREFIX + "device_info" ) + "` WHERE device_mac = '" + mac + "' ";
    var rows = getData(read_query, function(err,data){
        if (err) {
            return callback(err);
        }
        return callback(null, data);
    });
}

function getHistory (token, callback) {
    var read_query = "SELECT * FROM `" + ( TABLE_PREFIX + "login_history" ) + "` WHERE history_logout_time is null and userToken = '" + token + "' ";
    var rows = getData(read_query, function(err,data){
        if (err) {
            return callback(err);
        }
        return callback(null, data[0]);
    });
}

function getProperties (callback) {
    var read_query = "SELECT * FROM `" + ( TABLE_PREFIX + "system_properties" ) + "` WHERE p_name = 'TOKEN_EXPIRE' ";
    var rows = getData(read_query, function(err,data){
        if (err) {
            return callback(err);
        }
        return callback(null, data[0]);
    });
}






    
