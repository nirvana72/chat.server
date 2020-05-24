const redis = require('redis');
const client = redis.createClient(8900, '127.0.0.1');
client.auth(123456);

let users = {}

users.init = function() {
  client.keys('user:*', function(err, keys) {
    keys.forEach(key => {
      client.del(key)
    })
  })
}

users.add = function(uid, wskey) {
  client.set(`user:wskey:${uid}`, wskey)
  client.set(`user:uid:${wskey}`, uid)
  client.sadd('user:list', uid)
}

users.del = async function(wskey) {  
  let res = await new Promise( (resolve) => {
    client.get(`user:uid:${wskey}`, function(err, uid) {
      client.del(`user:wskey:${uid}`)
      client.del(`user:uid:${wskey}`)
      client.srem('user:list', uid)
      return resolve(uid)
    })
  })
  return res
}

// val = uid | wskey
users.exist = async function(val) {  
  let res = await new Promise( (resolve) => {
    if (isNumber(val)) {
      // uid exist
      client.sismember('user:list', val, function(err, res){
        return resolve(res === 1)
      })
    } else {
      // wskey exist
      client.exists(`user:uid:${val}`, function(err, res){
        return resolve(res === 1)
      })
    }
  })
  return res
}

function isNumber(val) {
  return /^[0-9]*$/.test(val)
}

module.exports = users