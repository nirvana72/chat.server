const online_users = require("./users.js");

for (let i = 1; i < 10; i++) {
  online_users.add({
    uid: i,
    wskey: `key${i}`
  })
}

// async function load() {
//   let list = await online_users.list()
//   console.log(list)
// }



// load()

let result = online_users.test("key1")