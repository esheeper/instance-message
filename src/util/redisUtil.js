const redis = require('redis');
// 连接redis
var client = redis.createClient(6379,'localhost');

// 获取redis中的数据
const redisGet =  async (key) => {
    return new Promise((success, error) => {
        client.get(key, (err, value) => {
            if (err) { 
                error({"from":0,"type":"E","msg":"Fail to get data from redis!"})
             }
            success(value);
        })
    })
};

// 设置redis中的数据
const redisSet =  async (key,value) => {
    return new Promise((success, error) => {
        client.set(key,value,(err, value) => {
            if (err) { 
                error({"from":0,"type":"E","msg":"Fail to get data from redis!"})
             }
            success(value);
        })
    })
};

// 将聊天信息储存到redis中
const redisLpush =  async (key,value) => {
    return new Promise((success, error) => {
        client.lpush(key,value,(err, value) => {
            if (err) { 
                error("Failed")
            }
            success(value);
        })
    })
};


// 给另一个Mysql进程做数据持久化存储的
const redisRpop =  async (key) => {
    return new Promise((success, error) => {
        client.rpop(key,(err, value) => {
            if (err) { 
                error("Failed")
            }
            success(value);
        })
    })
};


// 主要是添加数据到用户的关系集合
const redisSadd = async (uid,value) => {
    return new Promise((success, error) => {
        client.sadd("URS:"+uid,value,(err, value) => {
            if (err) { 
                error("Failed")
            }
            success(value);
        })
    })
};

// 判断两个用户是否具有关系
const redisSismember = async (key,value) => {
    return new Promise((success, error) => {
        client.sismember(key,value,(err, value) => {
            if (err) { 
                error("Failed")
            }
            success(value);
        })
    })
};

// 添加订单位置数据以及送货员位置数据到GEO中
const redisGeoadd = async (key,value) => {
    return new Promise((success, error) => {
        client.geoadd(key,value,(err, value) => {
            if (err) { 
                error("Failed")
            }
            success(value);
        })
    })
};

//
const redisGeopos = async (key,member,value) => {
    return new Promise((success, error) => {
        client.geopos(key,member,value,(err, value) => {
            if (err) { 
                error("Failed")
            }
            success(value);
        })
    })
};

module.exports = {
    redisSet,
    redisGet,
    redisLpush,
    redisRpop,
    redisSadd,
    redisSismember,
    redisGeoadd
};