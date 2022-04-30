const {redisSet,redisGet} = require('../util/redisUtil')


async function main(){
    let k = await redisGet("sdafd")
    console.log(k)
}
// letredisSet("t",true) //
main()