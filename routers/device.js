var express = require('express');
var router = express.Router();
var async  = require('async');
var config = require('../config');
var mongoDevice = require('../modules/mongoDevice.js');
var mysqlTool = require('../modules/mysqlTool.js');
var util = require('../modules/util.js');
//Mysql database API

module.exports = (function() {
	//Pagination settings
	var paginate = config.paginate;
	var page_limit = config.page_limit;
	//Read 
	router.get('/', function(req, res) {
		var token = req.query.token;
		var mac = req.query.macAddr;
		if (mac === undefined || token === undefined) {
			res.send({
				"responseCode" : '999',
				"responseMsg" : 'Missing parameter'
			});
			return false;
		}
		var from = null, to = null;
		if (req.query.from)
			from = req.query.from;
		if (req.query.to)
			to = req.query.to;	

		if(req.query.paginate)
			paginate = (req.query.paginate === 'true');
		if(req.query.limit)
			page_limit = req.query.limit;
		var page = 1;
		if(req.query.page)
			page = req.query.page;
		var offset = (page-1) * page_limit;

		//Calculate pages
		var next = Number(page)+1;
		if(page != 1)
			var previous = Number(page)-1;
		else
			var previous = Number(page);
		var json = {macAddr: mac};
		if(from !== null && to !== null) {
			json.recv = {$gte: from, $lte: to};
		}
		// Check token then get devices

        util.checkAndParseToken(token, function(err,result){
			if (err) {
				res.send({err});
				return false;
			} else { 
				//Token is ok
				var tokenArr = result;
				mongoDevice.find(json, paginate, offset, page_limit).then(function(data) {
					// on fulfillment(已實現時)
					console.log('docs : ' + JSON.stringify(data));
					res.status(200);
					res.setHeader('Content-Type', 'application/json');
					if (paginate) {
						res.json({
							"responseCode" : '000',
							"pages" : {
								"total": data.total,
								"next": next,
								"previous": previous,
								"last": Math.ceil(data.total/page_limit),
								"limit": page_limit
							},
							"data" : data.docs
						});
					} else {
						res.json({
							"responseCode" : '000',
							"data" : data
						});
					}
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

	return router;

})();
     
