var express = require('express');
var router = express.Router();
var async  = require('async');
var config = require('../config');
var util = require('../modules/util.js');
var mongoMap = require('../modules/mongoMap.js');

module.exports = (function() {
    //Read 
	router.get('/', function(req, res) {
		var token = req.query.token;
        if ( token === undefined) {
			res.send({
				"responseCode" : '999',
				"responseMsg" : 'Missing parameter'
			});
			return false;
		}
		
        util.checkAndParseToken(token, function(err,result){
			if (err) {
				res.send({err});
				return false;
			} else { 
				//Token is ok
                var tokenArr = result;
                mongoMap.find({}).then(function(data) {
                    // on fulfillment(已實現時)
                    res.status(200);
					res.setHeader('Content-Type', 'application/json');
					res.json({
                        "responseCode" : '000',
                        "data" : data
                    });
                }, function(reason) {
                    // on rejection(已拒絕時)
                    res.send({
                        "responseCode" : '999',
                        "responseMsg" : reason
                    }); 
                }); 
			}
		});
    });
    
	router.get('/:type', function(req, res) {
		var token = req.query.token;
        var type = req.params.type;
        if (type === undefined || token === undefined) {
			res.send({
				"responseCode" : '999',
				"responseMsg" : 'Missing parameter'
			});
			return false;
		}
        var json = {'type': type};
		
        util.checkAndParseToken(token, function(err,result){
			if (err) {
				res.send({err});
				return false;
			} else { 
				//Token is ok
                var tokenArr = result;
                mongoMap.find(json).then(function(data) {
                    // on fulfillment(已實現時)
                    res.status(200);
					res.setHeader('Content-Type', 'application/json');
					res.json({
                        "responseCode" : '000',
                        "data" : data
                    });
                }, function(reason) {
                    // on rejection(已拒絕時)
                    res.send({
                        "responseCode" : '999',
                        "responseMsg" : reason
                    }); 
                }); 
			}
		});
	});
    
    router.post('/', function(req, res) {
        var checkArr = ['token','type','typeName','fieldName','map','createUser'];
        var obj = util.checkFormData(req, checkArr);
        if (obj === null) {
            res.send({
				"responseCode" : '999',
				"responseMsg" : 'Missing parameter'
			});
        } else if (typeof(obj) === 'string') {
            res.send({
				"responseCode" : '999',
				"responseMsg" : obj
			});
        }
        util.checkAndParseToken(req.body.token, function(err,result){
			if (err) {
				res.send({err});
				return false;
			} else { 
				//Token is ok
                var tokenArr = result;
                mongoMap.create(obj).then(function(data) {
                    // on fulfillment(已實現時)
                    res.status(200);
					res.setHeader('Content-Type', 'application/json');
					res.json({
                        "responseCode" : '000',
                        "data" : data
                    });
                }, function(reason) {
                    // on rejection(已拒絕時)
                    res.send({
                        "responseCode" : '999',
                        "responseMsg" : reason
                    }); 
                }); 
			}
		});
	});

	//Delete by ID 
	router.delete('/:table/:id', function(req, res) {
		sequelize.query("SHOW KEYS FROM `"+TABLE_PREFIX+req.params.table+"` WHERE Key_name = 'PRIMARY'", { type: sequelize.QueryTypes.SELECT})
		.then(function(keys) {
			var primary_key = keys[0].Column_name;
			sequelize.query("DELETE FROM `"+TABLE_PREFIX+req.params.table+"` WHERE `"+ primary_key +"` = "+mysql_clean(req.params.id), { type: sequelize.QueryTypes.DELETE})
			.then(function() {
				res.status(200);
				res.json({
					"responseCode" : '000',
					"responseMsg": "Deleted"
				});
			})
			.catch( function(err) {
				res.send({
					"responseCode" : '999',
					"responseMsg" : err.message
				});
			});
		})
		.catch( function(err) {
			res.send({
				"responseCode" : '999',
				"responseMsg" : err.message
			});
		});
	});

	return router;

})();
     
