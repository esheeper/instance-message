const {redisGeoadd} = require('../util/redisUtil')



redisGeoadd("geotest",[10,10,"po"],async function (pa) {
    console.log(pa)
})