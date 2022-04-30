const Ws = require('ws').Server;
const {
    redisLpush,
    redisSismember,
    redisGeoadd,
    redisGet,
    redisSadd,
 } = require('./util/redisUtil')
const {jwtVerifyTokenHandle} = require('./util/jwtUtil')
const verifyArrivalPackage = require('./util/verifyArrivalPackage')
console.log(verifyArrivalPackage)
const {
    errorSendFunc,
    pongSendFunc,
    msgSendFunc,
    systemSendFunc,
} = require('./util/sendFunc')
const {
    ERR_BAD_DATA_FORMATION,
    ERR_MESSAGE_TOO_LONG,
    ERR_INVALIDATE_TOKEN,
    ERR_NOT_RELATIVE,
    ERR_FAIL_TO_STORAGE_MESSAGE,
    ERR_STATUS,
    ERR_UNKNOWN,
    ERR_CANT_FIND_ORDER,
    NOT_CLOSE_WEBSOCKET,
    SUC_LOGIN_SUCCESS
} = require('./constans/returnMessage')
const {PORT} = require('./config/websocket')
const pool = require('./util/mysqlconnection')


const wss = new Ws({
    port:PORT
})

// socket对象维护在一个字典里
// 对应用户id:{"ping":timestamp,"socket":socket}
const socketList = {}
const GETHISTORYSTATEMENT = "select * from message where timestamp > ? and to = ? order by id limit 40";


// 开启ws服务
wss.on('connection',async function (connection,req){
    let socketid = null
    let dcode = null 
    try{
        console.log("有客户端连接上服务器")

        let token = req.url.split('/')[1]

        /*
            鉴权以及修改socketid
        */
      
        try
        {
            dcode = await jwtVerifyTokenHandle(token)
        }
        catch(e){
            errorSendFunc(connection,0,ERR_INVALIDATE_TOKEN)
            await connection.close()
        }
        if(dcode["type"] != "websocket" || dcode["id"] == null && typeof dcode["id"] != "number")
        {
            errorSendFunc(connection,0,ERR_INVALIDATE_TOKEN)
            await connection.close()
        }
        
        console.log(dcode)
        socketid = dcode["id"]
        console.log(socketid)

        // 鉴权成功
        if(socketList[socketid] != null)
        {
            systemSendFunc(socket[socketid],0,0,"S",NOT_CLOSE_WEBSOCKET,Date.now())
            await socket[socketid]["socket"].close()
        }

        socketList[socketid] = {
            "ping":Date.now(),
            "socket":connection
        }

        systemSendFunc(connection,0,0,"L",SUC_LOGIN_SUCCESS,Date.now())
    }catch(e)
    {

    }

    connection.on("message",async function (data) 
    {
        data = verifyArrivalPackage(data)
        if(data == null)
        {
            errorSendFunc(connection,0,ERR_BAD_DATA_FORMATION)
        }

        let type = data["type"]
        if(type == "P")
        {
            pongSendFunc(connection,data["id"])
            socketList[socketid][timestamp] = Date.now()
            return
        }
        try
        {
            switch (type){
                case "t":
                {
                    let is = await redisSismember("URS:"+socketid,data["to"])
                    console.log(socketid,data["to"])
                    if(!is)
                    {
                        errorSendFunc(connection,data["id"],ERR_NOT_RELATIVE)
                        return
                    }
                    if(data["msg"].length > 1023)
                    {
                        errorSendFunc(connection,data["id"],ERR_MESSAGE_TOO_LONG);
                        return
                    }
                    else
                    {
                        
                        let message = {
                            from:socketid,
                            to:data["to"],
                            type:data["type"],
                            msg:""+data["msg"],
                            send:false,
                            timestamp: new Date()
                        }
                        console.log(data["to"],socketList[data["to"]])
                            if(socketList[data["to"]] != null)
                            {
                                message.send = true
                                try{
                                    await redisLpush("MQ",JSON.stringify(message));
                                }
                                catch(e)
                                {
                                    console.log(e)
                                    errorSendFunc(connection,data["id"],ERR_FAIL_TO_STORAGE_MESSAGE)
                                    return
                                }
                                msgSendFunc(socketList[data["to"]]["socket"],data["id"],socketid,"t",data["msg"],connection,message["timestamp"],1)
                            }
                            else
                            {
                                try{
                                    await redisLpush("MQ",JSON.stringify(message));
                                }
                                catch(e)
                                {
                                    errorSendFunc(connection,data["id"],ERR_FAIL_TO_STORAGE_MESSAGE)
                                    return
                                }  
                            }
                    }
                    systemSendFunc(connection,data["id"],0,"A","",Date.now());
                    break
                }
                case "i":
                {
                    let is = await redisSismember("URS:"+socketid,data["to"])
                    if(!is)
                    {
                        errorSendFunc(connection,data["id"],ERR_NOT_RELATIVE)
                        return
                    }
                    if(data["msg"].length > 1023)
                    {
                        errorSendFunc(connection,data["id"],ERR_MESSAGE_TOO_LONG);
                        return
                    }
                    else
                    {
                        
                        let message = {
                            from:socketid,
                            to:data["to"],
                            type:data["type"],
                            msg:""+data["msg"],
                            send:false,
                            timestamp: new Date()
                        }
                            if(socketList[data["to"]] != null)
                            {
                                message.send = true
                                try{
                                    await redisLpush("MQ",JSON.stringify(message));
                                }
                                catch(e)
                                {
                                    errorSendFunc(connection,data["id"],ERR_FAIL_TO_STORAGE_MESSAGE)
                                    return
                                }
                                msgSendFunc(socketList[data["to"]]["socket"],data["id"],socketid,"t",data["msg"],connection,message["timestamp"],1)
                            }
                            else
                            {
                                try{
                                    await redisLpush("MQ",JSON.stringify(message));
                                }
                                catch(e)
                                {
                                    errorSendFunc(connection,data["id"],ERR_FAIL_TO_STORAGE_MESSAGE)
                                    return
                                }  
                            }  
                    }
                    systemSendFunc(connection,data["id"],0,"A","",Date.now());
                    break
                }
                
                case "O":{
                    let oid = data["msg"]
                    if(socketList[oid] == null )       
                    {
                        systemSendFunc(connection,data["id"],0,"O",false,Date.now());
                        return
                    }             
                    if( socketList[oid]["timestamp"] + 90000 < Date.now())
                    {
                        socketList[oid]["socket"].close()
                        socketList[oid] = null
                        systemSendFunc(connection,data["id"],0,"O",false,Date.now());
                        return
                    }
                    systemSendFunc(connection,data["id"],0,"O",true,Date.now());  
                    break           
                }
                case "S":
                {
                    // 首先要判断用户是否是带货员,根据redis的DEVELIVER集合
                    let is = await redisSismember("DELIVER",socketid);
                    if(is)
                    {
                        redisGeoadd("GEO:DELIVER",[data["msg"]["latitude"],data["msg"]["longtitude"],socketid]);
                        systemSendFunc(connection,data["id"],0,"A","updated position")
                        return
                    }
                    else
                    {
                        errorSendFunc(connection,data["id"],ERR_STATUS)
                        return
                    }
                }
                case "H":
                {
                    let date = data["msg"];
                    let result = await pool.execute(GETHISTORYSTATEMENT,[new Date(date),socketid])
                    systemSendFunc(connection,data["id"],0,"H",result,Date.now())
                }
                case "T":
                {   
                    let order = await redisGet("order:"+data[msg]["order"])
                    if(order == null)
                    {
                        errorSendFunc(connection,data["id"],ERR_CANT_FIND_ORDER)
                    }
                    else
                    {
                        order = JSON.parse(order)
                        let message = {
                            form:socketid,
                            to:order["costomer"],
                            type:"s",
                            message:""+order["id"],
                            send:false,
                            timestamp:new Date()
                        }

                        //在这里只建立收货人和送货人之间的联系,用户接单的时候就会建立客户和带货人的联系
                        redisSadd(socketid,order["costomer"])
                        redisSadd(order["costomer"],socketid)                       
                        
                        if(socketList[order["costomer"]] != null)
                        {
                            try{
                                await redisLpush("MQ",JSON.stringify(message));

                            }
                            catch(e)
                            {
                                errorSendFunc(connection,data["id"],ERR_FAIL_TO_STORAGE_MESSAGE)
                                return
                            }
                            msgSendFunc(socketList[order["costomer"]]["socket"],data["id"],socketid,"s",message["message"],connection,message["timestamp"],1)
                        }
                        else
                        {
                            try{
                                await redisLpush("MQ",JSON.stringify(message));
                            }
                            catch(e)
                            {
                                errorSendFunc(connection,data["id"],ERR_FAIL_TO_STORAGE_MESSAGE)
                                return
                            }
                        }

                    }
                }
                default:
                    errorSendFunc(connection,"Error type")
                    break
            }
        }catch(e){
            console.log(e)
            errorSendFunc(connection,data["id"],ERR_UNKNOWN);
        }
        
    })

    connection.on("close",function (){
        console.log(socketid+"关闭连接")
        socketList[socketid] = null
    })
})

