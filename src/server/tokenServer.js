const koa = require("koa")
const Router = require("koa-router")
const sign = require("./generateToken")
const {PORT} = require("../config/tokenServer")

const app = new koa()
const route = new Router()

app.use(async (ctx, next)=> {
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Headers', 'Content-Type');
    ctx.set('Access-Control-Allow-Methods', 'POST');
    await next();
  });


route.get("/:id",async function (ctx, next){
    console.log(ctx.params)
    const result = await sign(parseInt(ctx.params.id))
    ctx.body = result
})

app.use(route.routes())
app.use(route.allowedMethods())

app.listen(PORT,function(){
    console.log("启动成功")
})