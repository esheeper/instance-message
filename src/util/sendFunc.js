const {RedisLpush} = require('./redisUtil') 

const errorSendFunc = async function (destinationSocket,id,err) {
    try{
        await destinationSocket.send(JSON.stringify({
            id:id,
            from: 0,
            type:  "E",
            msg: err
        })).catch(function (){
            return
        })
    }
    catch(err) {
        return
    }
    
}

const pongSendFunc = async function (destinationSocket,id) { 
    try{
    await destinationSocket.send(JSON.stringify(
        {
            id:id,
            from:0,
            type:"P",
            msg:"pong"
        }
    ))
    }catch(err) {
        return
    }

}

const systemSendFunc = async function (destinationSocket,id,from,type,msg,timestamp){
    try{
        await destinationSocket.send(JSON.stringify({
            id:id,
            from: from,
            type:  type,
            msg: msg,
            timestamp: timestamp,
        }))
    }catch(e){
        return
    }

}


const msgSendFunc = async function (destinationSocket,id,from,type, msg,resourceSocket,timestamp,retry) {
    try{
        await destinationSocket.send(JSON.stringify({
            id:id,
            from: from,
            type:  type,
            msg: msg,
            timestamp: timestamp,
        }))
    }catch(e){
        if(retry < 3)
        {
            setTimeout(msgSendFunc(destinationSocket,id,from,type,msg,resourceSocket,timestamp,++retry),retry*1000)
        }
    }
}


module.exports = {
    errorSendFunc,
    pongSendFunc,
    msgSendFunc,
    systemSendFunc
}