const jwt = require('jsonwebtoken')
const {redisGet} = require("../util/redisUtil")

async function main(id) 
{
    const privateKey = await redisGet("privateKey") 
    const result = await jwt.sign(
        {"id":id,"type":"websocket"},
        privateKey,
        {algorithm: 'RS256',expiresIn: 60 * 2})
        console.log(result)
    return result
}

main();
// module.exports = main