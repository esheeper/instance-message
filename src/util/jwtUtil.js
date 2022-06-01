const jwt = require('jsonwebtoken');
const {redisGet} = require('./redisUtil')

// token解密

const jwtVerifyTokenHandle = async (data) => {
  // token 解密 返回Promise
  console.log("2",data)
  const privateKey = await redisGet("publicKey")
  return new Promise((resolve, reject) => {
    jwt.verify(data, privateKey, {}, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};

module.exports = {
  jwtVerifyTokenHandle
};
