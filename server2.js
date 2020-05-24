const ws = require("nodejs-websocket");
const chinaTime = require('china-time');
const users = require("./users.js");

// 清空数据
users.init()

const server = ws.createServer(function(conn){
  // 一个新的连接创建时
  console.log('--------------connection-------------')
  console.log(conn.key)
  
  conn.on('text', function(str) {
    console.log('--------------text-------------')
    console.log(str)

    let data = JSON.parse(str)
    switch(data.cmd) {
      case 'online': {
        online(data.params, conn)
        break
      }
      case 'message': {
        message(data.params)
        break
      }
    }
  })

  conn.on('close', function(code) {
    console.log('--------------close-------------')
    // console.log(code)
    offline(conn.key)
  })

  conn.on('error', function(code) {
    console.log('--------------error-------------')
    console.log('异常关闭', code)
  })

});

// 某人上线
async function online({ uid, nickname, avatar}, conn) {
  // 是否重复上线
  let is_uid_exist = await users.exist(uid)
  console.log(`is_uid_exist = ${is_uid_exist}`)
  if (!is_uid_exist) {
    // 添加到 redis
    users.add(uid, conn.key)
    // 广播
    let data = {
      cmd: 'online',
      params: { uid, nickname, avatar }
    }
    let str = JSON.stringify(data)
    boardcast(str)
  } else {
    let data = {
      cmd: 'error',
      params: { msg: '用户已在线' }
    }
    let str = JSON.stringify(data)
    conn.sendText(str)
  }
}

// 聊天消息广播
// 缓存最近10条消息，让新来的可以看到历史消息
function message(params) {
  let data = {
    cmd: 'message',
    params: {
      uid: params.uid,
      nickname: params.nickname,
      avatar: params.avatar,
      msg: params.msg,
      time: chinaTime('HH:mm:ss')
    }
  }
  let str = JSON.stringify(data)
  boardcast(str)
}

// 某人下线
async function offline(key) {
  let is_key_exist = await users.exist(key) 
  console.log(`is_key_exist = ${is_key_exist}`)
  if (is_key_exist) {
    let uid = await users.del(key)
    let data = {
      cmd: 'offline',
      params: { uid: uid }
    }
    let str = JSON.stringify(data)
    boardcast(str)
  }
}

// 广播
function boardcast(str) {
  server.connections.forEach( conn => {
    conn.sendText(str)
  })
}

server.listen(8891);