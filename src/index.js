// Exporting!
module.exports = {
  client: require("./client"),
  queue: require("./queue.js"),
  function: require("./functions")
}

const betterMysql = require("./client");

let client = new betterMysql({
  token: "root.XwMUvVxYtN2KdtdJ"
  // host: "db4free.net",
  // user: "paul52",
  // pass: "Paul12345"
});

client.loadDatabase("hosting123").then(async (database) => {
  console.log("Database");
  let getSet = database.use(client.extenders.getset);
  let example = new getSet("example", true);
  await example.waitForReady();
  console.log("Ready!");
  example.set("test", "hoi");
  // console.log(example.get("test"));
});
