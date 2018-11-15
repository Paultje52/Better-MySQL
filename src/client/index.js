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
    if (!options.host) throw "In the options has to be a host!";
    if (!options.user && !options.username) throw "In the options has to be a username!";
    if (!options.pass && !options.password) throw "In the options has to be a password!";

    // Setting up the variables
    this.host = options.host;
    this.username = options.user || options.username;
    this.password = options.pass || options.password;
    this.databases = {};

    // Backuping
    /*if (typeof options.backuping !== "boolean") options.backuping = false;
    if (!options.backupInterval) options.backupInterval = 15;
    options.backupInterval = Number(options.backupInterval*60*1000);
    if (!options.backupName) options.backupName = "[better-mysql-backup-{number}]{name}";
    if (!options.backupGoal) options.backupGoal = "database";
    if (typeof options.backupDownload !== "boolean") options.backupDownload = false;
    if (options.backupDownload) {
      if (!options.backupDownloadFolder) options.backupDownloadFolder = "./better-mysql-backups";
      if (!options.backupDownloadExtention) options.backupDownloadExtention = "json";
      if (!["json", "yml"].includes(options.backupDownloadExtention.toLowerCase())) throw `Invaled backup download extention: ${options.backupDownloadExtention}`
    }
    if (typeof options.backupOverride !== "boolean") options.backupOverride = true;
    if (!options.backupLimit) options.backupLimit = null;
    if (typeof options.backupOverrideAfterLimit !== "boolean") options.backupOverrideAfterLimit = options.backupOverride;
    this.backuping = {
      enabled: options.backuping,
      interval: options.backupInterval,
      name: options.backupName,
      goal: options.backupGoal,
      download: options.backupDownload,
      override: options.backupOverride,
      limit: options.backupLimit,
      backupOverrideAfterLimit: options.backupOverrideAfterLimit,
      temp: {
        times: 0,

      }
    };
    if (options.backupDownload) this.backuping.downloadData = {
      folder: options.backupDownloadFolder,
      extention: options.backupDownloadExtention
    }; */

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

    // Queue
    if (!options.queueInterval) options.queueInterval = 500;
    if (!options.queue && typeof options.queue === "boolean") options.queueInterval = 10;
    this.queue = new queue(options.queueInterval);


    // Backups
    /* SOON */
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
