// Needed packages
const table = require("./table.js");

// Class
module.exports = class {
  // Constructor
  constructor(options) {
    this.old = options.this;
    this.queue = this.old.queue;
    this.emit = this.old.emit;

    this.queue = this.queue;
    this.connection = options.connection;
    this.name = options.name;
  }

  // Use
  use(thing) {
    if (!thing) throw "No use thing!";
    if (typeof thing !== "function") throw "The use thing has to be a function!";
    return thing(this, "database");
  }

  // get columns
  getColumns(table) {
    if (!table) throw "No table!";
    let connection = this.connection;
    let queue = this.queue;
    this.emit("sql", `SHOW COLUMNS FROM ${table.toLowerCase()}`, "database", "loadTable");
    return new Promise((resolve, reject) => {
      queue.add(() => {
        connection.query(`SHOW COLUMNS FROM ${table.toLowerCase()}`, (err, result) => {
          if (err) reject(err);
          let columns = [];
          result.forEach(res => {
            columns.push(res.Field);
          });
          resolve(columns);
        });
      });
    });
  }

  // Load table
  loadTable(name) {
    if (!name) throw "No name!";
    let connection = this.connection;
    let queue = this.queue;
    let t = this;
    this.emit("sql", `SHOW COLUMNS FROM ${name.toLowerCase()}`, "database", "loadTable");
    return new Promise((resolve, reject) => {
      queue.add(() => {
        connection.query(`SHOW COLUMNS FROM ${name.toLowerCase()}`, (err, result) => {
          if (err) reject(err);
          let columns = [];
          result.forEach(res => {
            columns.push(res.Field);
          });
          resolve(new table({this: t, connection: connection, name: name.toLowerCase(), columns: columns.join(", ")}));
        });
      });
    });
  }

  // Create table
  createTable(name, columns) {
    if (!name) throw "No name!";
    if (!columns) throw "No columns"
    if (typeof columns !== "object") throw "Invaled columns!";
    try {
      columns.forEach(c => {});
    } catch(e) {
      throw "Invaled columns";
    }
    if (columns.includes("key")) throw "You can't use `key` in a name of a column.";
    let cols = [];
    columns.forEach(c => {
      cols.push(`${c} BLOB(1000000)`);
    });
    let connection = this.connection;
    let queue = this.queue;
    let t = this;
    this.emit("sql", `CREATE TABLE ${name.toLowerCase()} (${cols.join(", ")})`, "database", "loadTable");
    return new Promise((resolve, reject) => {
      queue.add(() => {
        connection.query(`CREATE TABLE ${name.toLowerCase()} (${cols.join(", ")})`, (err, result) => {
          if (err) reject(err);
          resolve(new table({this: t, connection: connection, name: name.toLowerCase(), columns: columns.join(", ")}));
        });
      });
    });
  }

  // Edit table
  chanceTable(table, action, v, va) {
    if (!table) throw "No table!";
    if (!action) throw "No action!";
    if (typeof table !== "string") throw "Invaled table!";
    if (typeof action !== "string") throw "Invaled action!";
      if (action === "add_column") {
      if (!v) throw "No column name or array!";
      if (typeof v !== "string" && !isArray(v)) throw "Invaled column names!";
      let finalAddColumns = [];
      if (typeof v === "string") finalAddColumns.push(`${v} VARCHAR(255)`);
      else {
        v.forEach(thing => {
          finalAddColumns.push(`${thing} VARCHAR(255)`);
        });
      }
      let connection = this.connection;
      let queue = this.queue;
      this.emit("sql", `ALTAR TABLE ${table.toLowerCase()} ADD ${finalAddColumns.join(", ")}`, "database", "chanceTable", "add_column");
      return new Promise((resolve, reject) => {
        queue.add(() => {
          connection.query(`ALTAR TABLE ${table.toLowerCase()} ADD ${finalAddColumns.join(", ")}`, (err, result) => {
            if (err) reject(err);
            resolve(`Added ${finalAddColumns.join(", ")} to ${table.toLowerCase()}`);
          });
        });
      });
    } else if (action === "rename_column") {
      if (!v) throw "No old column name!";
      if (!va) throw "No new column name!";
      let connection = this.connection;
      let queue = this.queue;
      this.emit("sql", `ALTER TABLE ${table.toLowerCase()} CHANGE ${v} ${va} VARCHAR(255)`, "database", "chanceTable", "rename_column");
      return new Promise((resolve, reject) => {
        queue.add(() => {
          connection.query(`ALTER TABLE ${table.toLowerCase()} CHANGE ${v} ${va} VARCHAR(255)`, (err, result) => {
            if (err) reject(err);
            resolve(`Table ${table.toLowerCase()}: Column ${v} renamed to ${va}`);
          });
        });
      });
    } else if (action === "delete_column") {
      if (!v) throw "No column name!"
      let connection = this.connection;
      let queue = this.queue;
      this.emit("sql", `ALTAR TABLE ${table.toLowerCase()} DROP ${v}`, "database", "chanceTable", "delete_column");
      return new Promise((resolve, reject) => {
        queue.add(() => {
          connection.query(`ALTAR TABLE ${table.toLowerCase()} DROP ${v}`, (err, result) => {
            if (err) reject(err);
            resolve(`Column ${v} deleted in ${table.toLowerCase()}`);
          });
        });
      });
    } else if (action === "clear") {
      let connection = this.connection;
      let queue = this.queue;
      this.emit("sql", `DELETE FROM ${table.toLowerCase()}`, "database", "chanceTable", "clear");
      return new Promise((resolve, reject) => {
        queue.add(() => {
          connection.query(`DELETE FROM ${table.toLowerCase()}`, (err, result) => {
            if (err) reject(err);
            resolve(`All rows in ${table.toLowerCase()} cleared!`);
          });
        });
      });
    } else if (action === "clone") {
      if (!v) throw "No clone table name!";
      let connection = this.connection;
      let queue = this.queue;
      this.emit("sql", `CREATE TABLE ${v.toLowerCase()} LIKE ${table.toLowerCase()}`, "database", "chanceTable", "clone");
      this.emit("sql", `INSERT ${v.toLowerCase()} SELECT * FROM ${table.toLowerCase()}`, "database", "chanceTable", "clone");
      return new Promise((resolve, reject) => {
        queue.add(() => {
          connection.query(`CREATE TABLE ${v.toLowerCase()} LIKE ${table.toLowerCase()}`, (err, result) => {
            if (err) reject(`Error while creating table ${v.toLowerCase()}: ${err}`);
            queue.add(() => {
              connection.query(`INSERT ${v.toLowerCase()} SELECT * FROM ${table.toLowerCase()}`, (err) => {
                if (err) reject(err);
                resolve(`${table.toLowerCase()} cloned to ${v.toLowerCase()}`);
              });
            });
          });
        });
      });
    } else throw "Invaled action!";
  }

  // Get tables
  getTables() {
    let connection = this.connection;
    let name = this.name;
    let queue = this.queue;
    this.emit("sql", `SELECT * FROM information_schema.tables WHERE TABLE_SCHEMA = '${name}'`, "database", "getTables");
    return new Promise((resolve, reject) => {
      queue.add(() => {
        connection.query(`SELECT * FROM information_schema.tables WHERE TABLE_SCHEMA = '${name}'`, (err, result) => {
          if (err) reject(err);
          let endResult = [];
          result.forEach(res => {
            endResult.push(res.TABLE_NAME);
          });
          resolve(endResult);
        });
      });
    });
  }

  // Delete table
  deleteTable(name) {
    if (!name) throw "No name!";
    let connection = this.connection;
    let queue = this.queue;
    this.emit("sql", `DROP TABLE ${name.toLowerCase()}`, "database", "deleteTable");
    return new Promise((resolve, reject) => {
      queue.add(() => {
        connection.query(`DROP TABLE ${name.toLowerCase()}`, (err, result) => {
          if (err) reject(err);
          resolve(fields);
        });
      });
    });
  }
}
