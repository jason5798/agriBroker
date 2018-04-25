var Sequelize = require('sequelize');
var config = require('../config');
var dbHost = config.dbHost;

//Initialize database
var sequelize = new Sequelize(config.database, config.username, config.password, {
    host: dbHost,
    dialect: 'mysql',
    pool: {
        max: 10,
        min: 0,
        idle: 30000
    }
});
var TABLE_PREFIX = config.table_prefix;

module.exports = {
    insert,
    update,
    query,
    remove,
    getDevices,
    getHistory,
    getProperties,
    getUser,
    getGroup
}

function insert (sqlStr, callback) {
    sequelize.query(sqlStr, { type: sequelize.QueryTypes.INSERT})
		.then(function(id) {
			return callback(null, id);
		})
		.catch( function(err) {
			return callback(err);
		});
}

function update (sqlStr, callback) {
    sequelize.query(sqlStr, { type: sequelize.QueryTypes.UPDATE})
    .then(function() {
        return callback(null, 'update success');
    })
    .catch( function(err) {
        return callback(err);
    });
}

function query (query, callback) {
    sequelize.query(query, { type: sequelize.QueryTypes.SELECT})
		.then(function(rows) {
			return callback(null, rows);
		})
		.catch( function(err) {
            return callback(err);
		});
}

function remove (sqlStr, callback) {
    sequelize.query(sqlStr, { type: sequelize.QueryTypes.DELETE})
    .then(function() {
        return callback(null, 'delete success');
    })
    .catch( function(err) {
        return callback(err);
    });
}

function getDevices (mac, callback) {
    var read_query = "SELECT * FROM `" + ( TABLE_PREFIX + "device_info" ) + "` WHERE device_mac = '" + mac + "' ";
    var rows = query(read_query, function(err,data){
        if (err) {
            return callback(err);
        }
        return callback(null, data);
    });
}

function getHistory (token, callback) {
    var read_query = "SELECT * FROM `" + ( TABLE_PREFIX + "login_history" ) + "` WHERE history_logout_time is null and userToken = '" + token + "' ";
    var rows = query(read_query, function(err,data){
        if (err) {
            return callback(err);
        }
        return callback(null, data);
    });
}

function getProperties (p_name, callback) {
    var read_query = "SELECT * FROM `" + ( TABLE_PREFIX + "system_properties" ) + "` WHERE p_name = '"+p_name+"' ";
    var rows = query(read_query, function(err,data){
        if (err) {
            return callback(err);
        }
        return callback(null, data);
    });
}

function getUser (userInfo, callback) {
    var cp = userInfo.cp;
    var acc = userInfo.acc;
    var read_query = 'select usr.*, r.roleName, r.dataset from ((select * from api_user where userBlock = 0 and cpId =(select cpId from api_cp where cpName = "'+cp+'") and (userName = "'+acc+'" or email = "'+acc+'")) as usr left join api_role as r on usr.roleId = r.roleId)'
    console.log('getUser : \n' + read_query);
    var rows = query(read_query, function(err,data){
        if (err) {
            return callback(err);
        }
        return callback(null, data);
    });
}

function getGroup (roleId, callback) {
    var read_query = 'select g.grpId, g.grpName, m.createFlg, m.updateFlg, m.deleteFlg from api_ra_mapping m left join api_grp g on m.grpId = g.grpId where roleId = '+ roleId + ' order by m.sortId';
    console.log('getUser : \n' + read_query);
    var rows = query(read_query, function(err,data){
        if (err) {
            return callback(err);
        }
        return callback(null, data);
    });
}







    
