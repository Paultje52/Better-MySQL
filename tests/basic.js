const package = require("better-mysql");
let client = new package.client({
  host: "db4free.net",
  user: "YOURUSERNAME",
  pass: "YOURPASSWORD123"
});
client.loadDatabase("test123").then(database => {
  database.loadTable("example").then(table => {
    console.log("Use the variable \"table\" here to do things with the table");
  })
})
