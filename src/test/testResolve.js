const {jwtVerifyTokenHandle} = require("../util/jwtUtil")
const jwt = require("jsonwebtoken")
const {redisGet} = require("../util/redisUtil")

async function main(){

    const publicKey = await redisGet("privateKey")
    console.log(publicKey)
    let token = null
    let k = {"id":1}
    try{
        token = await jwt.sign(k,publicKey,{
            algorithm: 'RS256',
            expiresIn: 1
        })
    }
    catch(e){
        console.log("error1")
        console.log(e)
    }

    const vf = async (token) => {
        console.log(token)
        try{
            return await jwtVerifyTokenHandle(token)
        }catch(e){
            return "error2"
        }
    }
    console.log(await vf(token))
    console.log(await vf("eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjUxMTU4ODMzLCJleHAiOjE2NTExNjI0MzN9.Qx0xXqmAhMpguDBrV23U_vaDowd46pJDzxQ7vb4qL7fvH1egRA-pAv5ILQdkqCcvPBRIwR1P0vG21RtXgl_RDZ6gsviFtickD-uh5MlhprVWfm_ngtwum4pU5ePHi1dLY02w9N9J_Hk0DSqHGo4f0-bw6cBKaQLBZlY2qwkcmPkeyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjUxMTU4ODMzLCJleHAiOjE2NTExNjI0MzN9.Qx0xXqmAhMpguDBrV23U_vaDowd46pJDzxQ7vb4qL7fvH1egRA-pAv5ILQdkqCcvPBRIwR1P0vG21RtXgl_RDZ6gsviFtickD-uh5MlhprVWfm_ngtwum4pU5ePHi1dLY02w9N9J_Hk0DSqHGo4f0-bw6cBKaQLBZlY2qwkcmPk"))
}

main()