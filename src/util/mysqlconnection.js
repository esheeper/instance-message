const mysql2 = require('mysql2')
const {
    HOST,
    USER,
    PASSWORD,
    DATABASE
}  =  require('../config/mysql')


const pool = mysql2.createPool({
    host:HOST,
    user:USER,
    password:PASSWORD,
    database:DATABASE
})

// 异步编程
module.exports = pool.promise()