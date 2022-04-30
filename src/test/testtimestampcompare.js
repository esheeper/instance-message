const pool = require("../util/mysqlconnection")
async function main()
{
    const result = await pool.execute("select * from test where date < ?",[new Date()],async function (err,data) {
    })
    console.log(result[0])
}

main()
