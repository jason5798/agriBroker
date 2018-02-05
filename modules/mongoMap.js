var mongoose = require('./mongoose');
var Schema = mongoose.Schema;

let mapSchema = new Schema({
    type       : {  type: String, required: true},
    typeName   : {  type: String, required: true},
    fieldName  : {  type: Schema.Types.Mixed, 
                    default: null, 
                    required: false},
    map        : {  type: Schema.Types.Mixed, 
                    default: null, 
                    required: true},
    createUser : {  type: String, 
                    default: null, 
                    required: false},
    createTime : {  type: Date, 
                    default: null, 
                    required: false},
    updateUser : {  type: String, 
                    default: null, 
                    required: false},
    updateTime : {  type: Date, 
                    default: null, 
                    required: false},
});

var MapModel = mongoose.model('Map', mapSchema);

module.exports = {
    create,
    findLast,
    find,
    update
}

function create (obj) {
    var newMap = new MapModel({
        type        : obj.type,
        typeName    : obj.typeName,
        fieldName   : obj.fieldName,
        map         : obj.map,
        createUser  : obj.createUser,
        createTime  : new Date(),
        updateUser  : null,
        updateTime  : null
    });
    return new Promise(function (resolve, reject) {
        newMap.save(function(err, docs){
            if(!err){
                // console.log(now + ' Debug : Device save fail!');
                resolve(docs);
            }else{
                // console.log(now + ' Debug : Device save success.');
                reject(err);
            }
        });
    });
}

function findLast (json) {
    return new Promise(function (resolve, reject) {
        MapModel.find(json).sort({recv: -1}).limit(1).exec(function(err,docs){
            if(err){
                reject(err);
            }else{
                resolve(docs[0]);
            }
        });
    });
}

function find (json) {
    return new Promise(function (resolve, reject) {
        MapModel.find(json).exec(function(err,docs){
            if(err){
                reject(err);
            }else{
                resolve(docs);
            }
        });
    });
}

function update (_type,json) {
    return new Promise(function (resolve, reject) {
        MapModel.update({type:_type},
        {"$set":json},{"upsert":true,},function (err,result){});
    });
}



