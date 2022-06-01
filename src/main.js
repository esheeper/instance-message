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
const coordtransform = require('coordtransform')

const wss = new Ws({
    port:PORT
})

// socket对象维护在一个字典里
// 对应用户id:{"ping":timestamp,"socket":socket}
const socketList = {}

// 全域查询，查询所有的人发送给我的以及我发送给他们的
const GETHISTORYSTATEMENT = "select * from message where id > ? and (\`from\` = ? or \`to\` = ?) order by id desc limit 40";
const GETRECENTHISTORYSTATEMENT = "select * from message where \`from\` = ? or \`to\` =? order by id desc limit 40";

// 精确查询，查某个人发送过来的以及我发送过去的
const GETRECENTHISTORYBYNAMESTATEMENT = "select * from message where (\`from\` = ? and \`to\` = ?) and (\`from\` = ? and \`to\` = ?) order by id desc limit 40";
const GETHISTORYBYNAMESTATEMENT = "select * from message where id > ? and ((\`from\` = ? and \`to\` = ?) and (\`from\` = ? and \`to\` = ?)) order by id desc limit 40";

// 开启ws服务
wss.on('connection',async function (connection,req){
    let socketid = null
    let dcode = null 
    try{
        let token = req.url.split('/')[1]

        /*
            鉴权以及修改socketid
        */
      
        try
        {
            dcode = await jwtVerifyTokenHandle(token)
        }
        catch(e){
            errorSendFunc(connection,0,ERR_INVALIDATE_TOKEN);
            connection.close();
            return;
        }
        if(dcode["type"] != "websocket" || dcode["id"] == null && typeof dcode["id"] != "number")
        {
            errorSendFunc(connection,0,ERR_INVALIDATE_TOKEN);
            connection.close();
            return;
        }
        
        console.log(dcode)

        socketid = dcode["id"]

        // 鉴权成功
        if(socketList[socketid] != null)
        {
            systemSendFunc(socketList[socketid],0,0,"S",NOT_CLOSE_WEBSOCKET,Date.now())
            await socketList[socketid]["socket"].close()
        }

        socketList[socketid] = {
            "ping":Date.now(),
            "socket":connection
        }

        systemSendFunc(connection,0,0,"L",SUC_LOGIN_SUCCESS,Date.now())
        
    }catch(e)
    {
        errorSendFunc(connection,0,ERR_UNKNOWN)
        connection.close();
        return;
    }

    connection.on("message",async function (data) 
    {
        try
        {
            try{
                console.log("2",data);
                data = verifyArrivalPackage(data)
                if(data == null)
                {
                    errorSendFunc(connection,0,ERR_BAD_DATA_FORMATION)
                    return;
                }
            }catch(e)
            {
                errorSendFunc(connection,0,ERR_BAD_DATA_FORMATION)
            }
            let type = data["type"]
            if(type == "P")
            {
                pongSendFunc(connection,data["id"])
                socketList[socketid][ping] = Date.now()
                return
            }
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
                    let [longtitude,latitude] = coordtransform.gcj02towgs84(data["msg"]["longtitude"],data["msg"]["latitude"])  
                    if(is)
                    {
                        redisGeoadd("GEO:DELIVER",[latitude,longtitude,socketid]);
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
                    try{
                        let msg = data["msg"];
                        let id = msg["id"];
                        let from = msg["from"];
                        console.log(msg.id,from);
                        if(id == -1) // 获取最新的
                        {
                            if(from = -1) // 不指定获取某人的
                            {
                                let [result] = await pool.execute(GETRECENTHISTORYSTATEMENT,[socketid,socketid]);
                                await systemSendFunc(connection,data["id"],0,"H",result,Date.now())
                                return;
                            }
                            else // 指定获取某人的
                            {
                                let [result] = await pool.execute(GETRECENTHISTORYBYNAMESTATEMENT,[from,socketid,socketid,from]);
                                await systemSendFunc(connection,data["id"],0,"H",result,Date.now())
                                return;
                            }
                        }
                        else // 获取指定id之前的
                        {
                            if(from = -1) // 不要指定获取某人的
                            {
                                let [result] = await pool.execute(GETHISTORYSTATEMENT,[id,socketid,socketid]);
                                await systemSendFunc(connection,data["id"],0,"H",result,Date.now())
                                return;
                            }
                            else // 指定获取某人的
                            {
                                let [result] = await pool.execute(GETHISTORYBYNAMESTATEMENT,[id,from,socketid,socketid,from])
                                await systemSendFunc(connection,data["id"],0,"H",result,Date.now())
                                return;
                            }
                        }
                    }catch(e)
                    {
                        console.log(e)
                        errorSendFunc(connection,data["id"],ERR_UNKNOWN)
                        return
                    }
                }
                case "T":
                {   
                    let [order] = await pool.execute(`select * from \`require\` where id = ? and deliver = ?`,data["msg"],socketid);
                    if(order.length == 0)
                    {
                        errorSendFunc(connection,data["id"],ERR_CANT_FIND_ORDER)
                    }
                    else
                    {
                        let message = {
                            form:socketid,
                            to:order["costomer"],
                            type:"s",
                            message:""+order[0]["id"],
                            send:false,
                            timestamp:new Date()
                        }

                        //在这里只建立收货人和送货人之间的联系,用户接单的时候就会建立客户和带货人的联系
                        redisSadd(socketid,order[0]["costomer"])
                        redisSadd(order[0]["costomer"],socketid)                       
                        
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
        }
        catch(e){
            console.log(e)
            console.log(data);
            errorSendFunc(connection,data["id"],ERR_UNKNOWN);
        }
        
    })

    connection.on("close",function (){
        console.log(socketid+"关闭连接")
        socketList[socketid] = null
    })
})

process.on('unhandledRejection', (reason, p) => {
    console.log('Promise: ', p, 'Reason: ', reason)
    // do something
  })

