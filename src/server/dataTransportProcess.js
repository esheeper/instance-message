// 将redis中缓存的数据同步到mysql数据库中
const pool = require('../util/mysqlconnection')
const {redisRpop} = require('../util/redisUtil')
const statement = "insert into message(`from`,`to`,type,msg,send,`timestamp`) values ?";

async function run()
{
    let list = []
    let data = null
    while((data = await redisRpop("MQ")))
    {
        data = JSON.parse(data)
        list.push([
            data["from"],data["to"],data["type"],data["msg"],data["send"],new Date(data["timestamp"])
        ])
        console.log(list)
        if(list.length > 50)
        {
            try{
                await pool.query(statement,list)
                list = []
            }
            catch(err){
                console.log(err)
                list = []
            }
        }
    }
    if(list.length > 0){
        try{
            await pool.query(statement,[list])
            list = []
        }
        catch(err){
            console.log(err)
            list = []
        }
    }
    
}
setInterval(run,2000)