// Needed packages
const table = require("./table.js");

// Class
module.exports = class {
  // Constructor
  constructor(options) {
    this.oldThis = options.this;
    this.connection = options.connection;
    this.name = options.name;
  }

  // Load table
  loadTable(name) {
    if (!name) throw "No name!";
    let connection = this.connection;
    return new Promise(function(resolve, reject) {
      connection.query(`SHOW COLUMNS FROM ${name.toLowerCase()}`, (err, result, fields) => {
        if (err) reject(err);
        let columns = [];
        result.forEach(res => {
          columns.push(res.Field);
        });
        resolve(new table({connection: connection, name: name.toLowerCase(), columns: columns.join(", ")}));
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
    let connection = this.connection;
    return new Promise(function(resolve, reject) {
      let cols = [];
      columns.forEach(c => {
        cols.push(`${c} VARCHAR(255)`);
      });
      connection.query(`CREATE TABLE ${name.toLowerCase()} (${cols.join(", ")})`, (err, result) => {
        if (err) reject(err);
        resolve(new table({connection: connection, name: name.toLowerCase(), columns: columns.join(", ")}));
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
      return new Promise((resolve, reject) => {
        connection.query(`ALTAR TABLE ${table.toLowerCase()} ADD ${finalAddColumns.join(", ")}`, (err, result) => {
          if (err) reject(err);
          resolve(`Added ${finalAddColumns.join(", ")} to ${table.toLowerCase()}`);
        });
      });
    } else if (action === "rename_column") {
      if (!v) throw "No old column name!";
      if (!va) throw "No new column name!";
      let connection = this.connection;
      return new Promise((resolve, reject) => {
        connection.query(`ALTER TABLE ${table.toLowerCase()} CHANGE ${v} ${va} VARCHAR(255)`, (err, result) => {
          if (err) reject(err);
          resolve(`Table ${table.toLowerCase()}: Column ${v} renamed to ${va}`);
        });
      });
    } else if (action === "delete_column") {
      if (!v) throw "No column name!"
      let connection = this.connection;
      return new Promise((resolve, reject) => {
        connection.query(`ALTAR TABLE ${table.toLowerCase()} DROP ${v}`, (err, result) => {
          if (err) reject(err);
          resolve(`Column ${v} deleted in ${table.toLowerCase()}`);
        });
      });
    } else if (action === "clear") {
      let connection = this.connection;
      return new Promise((resolve, reject) => {
        connection.query(`DELETE FROM ${table.toLowerCase()}`, (err, result) => {
          if (err) reject(err);
          resolve(`All rows in ${table.toLowerCase()} cleared!`);
        });
      });
    } else if (action === "clone") {
      if (!v) throw "No clone table name!";
      let connection = this.connection;
      return new Promise((resolve, reject) => {
        connection.query(`CREATE TABLE ${v.toLowerCase()} LIKE ${table.toLowerCase()}`, (err, result) => {
          if (err) reject(`Error while creating table ${v.toLowerCase()}: ${err}`);
          connection.query(`INSERT ${v.toLowerCase()} SELECT * FROM ${table.toLowerCase()}`, (err) => {
            if (err) reject(err);
            resolve(`${table.toLowerCase()} cloned to ${v.toLowerCase()}`);
          });
        });
      });
    } else throw "Invaled action!";
  }

  // Get tables
  getTables() {
    let connection = this.connection;
    let name = this.name;
    return new Promise((resolve, reject) => {
      connection.query(`SELECT * FROM information_schema.tables WHERE TABLE_SCHEMA = '${name}'`, (err, result) => {
        if (err) reject(err);
        let endResult = [];
        result.forEach(res => {
          endResult.push(res.TABLE_NAME);
        });
        resolve(endResult);
      });
    });
  }

  // Delete table
  deleteTable(name) {
    if (!name) throw "No name!";
    let connection = this.connection;
    return new Promise(function(resolve, reject) {
      connection.query(`SELECT * FROM ${name.toLowerCase()}`, (err, result, fields) => {
        if (err) reject(err);
        connection.query(`DROP TABLE ${name.toLowerCase()}`, (err, result) => {
          if (err) reject(err);
          resolve(fields);
        });
      });
    });
  }
}
