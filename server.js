const ws = require("nodejs-websocket");

// rc.on('connect', function () {
//   // set 语法
//   rc.set('name', 'long', function (err, data) {
//       console.log(data)
//   })
//   // get 语法
//   rc.get('name', function (err, data) {
//       console.log(data)
//   })

//   rc.lpush('class',1,function (err,data) {
//       console.log(data)
//   })

//   rc.lrange('class',0,-1,function (err,data) {
//       console.log(data)
//   })
// })


const users = require("./users.js");

const server = ws.createServer(function(conn){
  console.log('new connection');
  
  conn.on('text', function(str) {
    let data = JSON.parse(str)

    switch(data.cmd) {
      case 'msg': {
        message(str)
        break
      }
      case 'connect': {
        online(data, conn)
        break
      }
      case 'getuserlist': {
        getuserlist(conn)
        break
      }
    }
  })

  conn.on('close', ws_close)

  conn.on('error', function(code) {
    console.log('异常关闭', code)
  })

});

// ---------------------------------------------------------------
// 断开连接
async function ws_close(code) {
  console.log(`close: 用户下线`)

  let index = users.findIndex(itm => itm.key === conn.key )
  if (index >= 0) {
    console.log(`close: ${users[index].uid} 用户下线`)
    let data = {
      cmd: 'offline',
      params: { uid: users[index].uid }
    }
    let str = JSON.stringify(data)
    server.connections.forEach((c) => {
      if (c.key !== users[index].key) {
        c.sendText(str)
      }
    })

    users.splice(index, 1)
  }

  console.log('关闭连接', code)
}
// ---------------------------------------------------------------
// 发送信息
function message(str) {
  server.connections.forEach( conn => {
    conn.sendText(str)
  })
}
// ---------------------------------------------------------------
// 获取用户列表
function getuserlist(conn) {
  let data = {
    cmd: 'getuserlist',
    params: { users }
  }
  conn.sendText(JSON.stringify(data))
}
// ---------------------------------------------------------------
// 新用户连接
function online(data, conn) {
  console.log(`connect: ${data.params.uid}`)
  let index = users.findIndex(itm => itm.uid === data.params.uid )
  if (index >= 0) {
    console.log(`connect: ${data.params.uid} 用户已登录`)
    let error = {
      cmd: 'error',
      params: { msg : '用户已登录' }
    }
    conn.sendText(JSON.stringify(error))
    return
  }

  let user = Object.assign(data.params, {})
  user.key = conn.key
  users.push(user)


  console.log(`connect: ${user.uid} 用户登录`)

  // 广播这个用户上线了
  let str = JSON.stringify({
    uid: data.params.uid,
    nick: data.params.nick,
    avatar: 1
  })
  server.connections.forEach(conn => {
    if (conn.key !== user.key) {
      conn.sendText(str)
    }
  })
}

server.listen(8891);