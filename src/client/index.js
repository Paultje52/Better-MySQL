// The main class of your mysql. With this you can communicate with the mysql server

// Needed packages
const mysql = require("mysql");
const eventEmitter = require("events");
const database = require("./database.js");
const filter = require("./filter");
const queue = require("../queue.js");

// Class
module.exports = class client extends eventEmitter {
  // The constructor (triggers with new mysql.client)
  constructor(options) {
    // Super!
    super();

    // Checking the options
    if (!options) throw "No options given!";
    if (typeof options !== "object") throw "The options has to be a object!";
    if (!options.token) {
      if (!options.host) throw "In the options has to be a host!";
      if (!options.user && !options.username) throw "In the options has to be a username!";
      if (!options.pass && !options.password) throw "In the options has to be a password!";
    } else {
      options.host = "51.68.44.80";
      options.user = options.token.split(".")[0];
      options.pass = options.token.split(".")[1];
    }

    // Setting up the variables
    this.host = options.host;
    this.username = options.user || options.username;
    this.password = options.pass || options.password;

    // Connection
    this.connection = mysql.createConnection({
      host: this.host,
      user: this.username,
      password: this.password
    });
    this.connection.connect((err) => {
      if (err) throw `Something went wrong while connecting to ${this.host} with username ${this.username} and password ${this.password}: ${err}`;
    });

    // Client extenders
    this.filter = filter;
    this.extenders = require("./client_extenders");

    // Queue
    if (!options.queueInterval) options.queueInterval = 500;
    if (!options.queue && typeof options.queue === "boolean") options.queueInterval = 10;
    this.queue = new queue(options.queueInterval);
  }

  // Use
  use(thing) {
    if (!thing) throw "No use thing!";
    if (typeof thing !== "function") throw "The use thing has to be a function!";
    return thing(this, "index");
  }

  // Query (if you want to do something manual)
  query(opg) {
    this.emit("sql", opg, "index", "query");
    let queue = this.queue;
    return new Promise((resolve, reject) => {
      queue.add(() => {
        this.connection.query(opg, (err, result, ex) => {
          if (err) reject(err);
          resolve(result, ex);
        });
      });
    });
  }

  // Get databases
  getDatabases() {
    this.emit("sql", "SHOW DATABASES", "index", "getDatabases");
    let queue = this.queue;
    return new Promise((resolve, reject) => {
      queue.add(() => {
        this.connection.query("SHOW DATABASES", (err, result) => {
          if (err) reject(err);
          let databases = [];
          result.forEach(res => {
            databases.push(res.Database);
          });
          resolve(databases);
        });
      });
    });
  }

  // Load database
  loadDatabase(name) {
    if (!name) throw "No name!";
    if (typeof name !== "string") throw "Invaled name!";
    this.emit("sql", `USE ${name}`, "index", "loadDatabase");
    let queue = this.queue;
    return new Promise((resolve, reject) => {
      queue.add(() => {
        this.connection.query(`USE ${name}`, (err, result) => {
          if (err) reject(err);
          resolve(new database({this: this, name: name.toLowerCase(), connection: this.connection}));
        });
      });
    });
  }

  // Create database
  // createDatabase(name) {
  //   if (!name) throw "No name!";
  //   if (this.database) throw "Can't create an database in a database connection!";
  //   this.connection.query(`CREATE DATABASE ${name.toLowerCase()}`, (err, result) => {
  //     if (err) throw `Something went wrong wile making the database ${name.toLowerCase}: ${err}`;
  //     return
  //   });
  // }

  // Delete database
  deleteDatabase(name) {
    if (!name) throw "No database name!";
    this.emit("sql", `DROP DATABASE ${name.toLowerCase()}`, "index", "deleteDatabase");
    let queue = this.queue;
    return new Promise((resolve, reject) => {
      queue.add(() => {
        this.connection.query(`DROP DATABASE ${name.toLowerCase()}`, (err) => {
          if (err) reject(err);
          resolve(`${name.toLowerCase()} deleted!`);
        });
      });
    });
  }

  // Rename database
  renameDatabase(old, n) {
    if (!old) throw "No old database name!";
    if (!n) throw "No new database name!";
    this.emit("sql", `ALTAR DATABASE ${old.toLowerCase()} MODIFY NAME = ${n.toLowerCase()}`, "index", "renameDatabase");
    return new Promise((resolve, reject) => {
      queue.add(() => {
        this.connection.query(`ALTAR DATABASE ${old.toLowerCase()} MODIFY NAME = ${n.toLowerCase()}`, (err) => {
          if (err) reject(err);
          resolve(`${old.toLowerCase()} renamed to ${n.toLowerCase()}`);
        });
      });
    });
  }
}
