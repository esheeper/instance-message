const mysql2 = require("mysql2")
const {redisSet,redisGet} = require("../util/redisUtil")

const re = mysql2.connect({
    host:"localhost",
    user:"root",
    password:"geeksheep",
    database:"huorunrun"
})

async function main() {
    re.execute("select * from test",[],async function (err,data){
        if(err){
            console.log(err)
        }
        console.log(data)
    })
    const ko = await redisGet("testDate")
    re.execute("insert into  test values(?)",[new Date(ko)],async function (err,data){
        if(err){
            console.log(err)
        }
        console.log(data)
    })
    
    redisSet("testDate",new Date())
} 

main()
