// The table class

// Needed packages
const isFunctionOfClass = require("../functions/index.js").isFunctionOfClass;
const isArray = require("../functions/index.js").isArray;

// Class
module.exports = class {
  constructor(options) {
    this.old = options.this;
    this.queue = this.old.queue;
    this.emit = this.old.emit;
    this.connection = options.connection;
    this.name = options.name;
    this.columns = options.columns;
    this.columnsArray = this.columns.split(", ");
  }

  getAll() {
    let connection = this.connection;
    let name = this.name;
    let queue = this.queue;
    this.emit("sql", `SELECT * FROM ${name}`, "table", "getAll");
    return new Promise((resolve, reject) => {
      queue.add(() => {
        connection.query(`SELECT * FROM ${name}`, (err, result, fields) => {
          if (err) reject(err);
          if (result.length === 0) resolve([]);
          else {
            let endResult = [];
            function json(is, thing, value, temp) {
              if (is) temp[thing] = JSON.parse(value);
              else temp[thing] = value;
            }
            result.forEach(res => {
              let temp = {};
              for (let i in res) {
                try {
                  JSON.parse(res[i]);
                  json(true, i, res[i], temp);
                } catch(err) {
                  json(false, i, res[i], temp);
                }
              }
              endResult.push(temp);
            });
            resolve(endResult);
          }
        });
      });
    });
  }

  // Add
  add(values) {
    if (!values) throw "No values!";
    try {
      values.forEach(value => {});
    } catch(e) {
      throw "Invaled values!";
    }
    for (let i = 0; i < values.length; i++) {
      if (values[i] === "position_number") throw "position_number is not usable for a value!";
      if (typeof values[i] === "object") values[i] = JSON.stringify(values[i]);
    }
    let connection = this.connection;
    let name = this.name;
    let columns = this.columns;
    let queue = this.queue;
    this.emit("sql", `INSERT INTO ${name} (${columns}) VALUES ('${values.join("', '")}')`, "table", "add");
    return new Promise((resolve, reject) => {
      queue.add(() => {
        connection.query(`INSERT INTO ${name} (${columns}) VALUES ('${values.join("', '")}')`, (err, result) => {
          if (err) reject(err);
          resolve(`Added to ${name}: ${values.join("', '")}`);
        });
      });
    });
  }

  // Where
  where(filter) {
    // Filter
    if (!filter) throw "No filter!";
    if (typeof filter !== "object") throw "Invaled filter!";
    if (isFunctionOfClass(filter)) filter = filter.handle();
    if (!filter.limit || !filter.divide || !filter.filters) throw "Invaled filter object!";
    if (!isArray(filter.filters)) throw "Invaled array for the filters!";
    filter.filters.forEach(f => {
      let valed = false;
      this.columnsArray.forEach(col => {
        if (col === f.column) valed = true;
      });
      if (!valed) throw `Invaled column in the filter ${f.column}`;
    });
    // Making filter for sql
    let sqlFilter = [];
    filter.filters.forEach(f => {
      switch (f.action) {
        case "lower":
          f.keyword = `LOWER(${f.keyword})`;
          break;
        case "upper":
          f.keyword = `UPPER(${f.keyword})`;
          break;
        default:
          f.keyword = f.keyword;
      }
      switch (f.type) {
        case "includes":
          sqlFilter.push(`\`${f.column}\` LIKE '%${f.keyword}%'`);
          break;
        case "starts":
          sqlFilter.push(`\`${f.column}\` LIKE '${f.keyword}%'`);
          break;
        case "ends":
          sqlFilter.push(`\`${f.column}\` LIKE '%${f.keyword}'`);
          break;
        case "less":
          sqlFilter.push(`\`${f.column}\` < '%${f.keyword}%'`);
          break;
        case "greater":
          sqlFilter.push(`\`${f.column}\` > '%${f.keyword}%'`);
          break;
        case "between":
          sqlFilter.push(`\`${f.column}\` BETWEEN '${f.keyword[0]}' AND '${f.keyword[1]}'`);
        default:
          sqlFilter.push(`\`${f.column}\` = '${f.keyword}'`);
      }
    });
    let limit = filter.limit;
    if (limit !== 0 && limit !== null) limit = `LIMIT ${limit}`;
    else limit = "";
    // Mysql
    let connection = this.connection;
    let name = this.name;
    let queue = this.queue;
    this.emit("sql", `SELECT * FROM ${name} WHERE (${sqlFilter.join(`) ${filter.divide} (`)})`, "table", "where");
    return new Promise((resolve, reject) => {
      queue.add(() => {
        connection.query(`SELECT * FROM ${name} WHERE (${sqlFilter.join(`) ${filter.divide} (`)})`, (err, result, fields) => {
          if (err) reject(err);
          if (result.length === 0) resolve(null);
          else {
            let endResult = [];
            let number = 0;
            function json(is, thing, value, temp) {
              if (is) temp[thing] = JSON.parse(value);
              else temp[thing] = value;
            }
            let temp = {};
            result.forEach(res => {
              for (let i in res) {
                try {
                  JSON.parse(res[i]);
                  json(true, i, res[i], temp);
                } catch(err) {
                  json(false, i, res[i], temp);
                }
              }
              endResult.push(temp);
              number = number+1;
            });
            resolve(endResult);
          }
        });
      });
    });
  }

  // Sort
  sort(order, filter) {
    if (!order) throw "No order!";
    if (isArray(order)) order = order.join(", ");
    if (filter) {
      // Filter
      if (typeof filter !== "object") throw "Invaled filter!";
      if (isFunctionOfClass(filter)) filter = filter.handle();
      if (!filter.limit || !filter.divide || !filter.filters) throw "Invaled filter object!";
      if (!isArray(filter.filters)) throw "Invaled array for the filters!";
      filter.filters.forEach(f => {
        let valed = false;
        this.columnsArray.forEach(col => {
          if (col === f.column) valed = true;
        });
        if (!valed) throw `Invaled column in the filter ${f.column}`;
      });
      // Making filter for sql
      let sqlFilter = [];
      filter.filters.forEach(f => {
        switch (f.action) {
          case "lower":
            f.keyword = `LOWER(${f.keyword})`;
            break;
          case "upper":
            f.keyword = `UPPER(${f.keyword})`;
            break;
          default:
            f.keyword = f.keyword;
        }
        switch (f.type) {
          case "includes":
            sqlFilter.push(`\`${f.column}\` LIKE '%${f.keyword}%'`);
            break;
          case "starts":
            sqlFilter.push(`\`${f.column}\` LIKE '${f.keyword}%'`);
            break;
          case "ends":
            sqlFilter.push(`\`${f.column}\` LIKE '%${f.keyword}'`);
            break;
          case "less":
            sqlFilter.push(`\`${f.column}\` < '%${f.keyword}%'`);
            break;
          case "greater":
            sqlFilter.push(`\`${f.column}\` > '%${f.keyword}%'`);
            break;
          case "between":
            sqlFilter.push(`\`${f.column}\` BETWEEN '${f.keyword[0]}' AND '${f.keyword[1]}'`);
          default:
            sqlFilter.push(`\`${f.column}\` = '${f.keyword}'`);
        }
      });
    }
    let limit = filter.limit;
    if (limit !== 0) limit = `LIMIT ${limit}`;
    else limit = "";
    // Mysql
    let connection = this.connection;
    let name = this.name;
    let queue = this.queue;
    if (filter) this.emit("sql", `SELECT * FROM ${name} WHERE (${sqlFilter.join(`) ${filter.divide} (`)}) ORDER BY ${order}`, "table", "sort", "filter");
    else this.emit("sql", `SELECT * FROM ${name} ORDER BY ${order}`, "table", "sort", "noFilter");
    return new Promise((resolve, reject) => {
      queue.add(() => {
        if (filter) {
          connection.query(`SELECT * FROM ${name} WHERE (${sqlFilter.join(`) ${filter.divide} (`)}) ORDER BY ${order}`, (err, result, fields) => {
            if (err) reject(err);
            if (result.length === 0) resolve(null);
            else {
              let endResult = [];
              let number = 0;
              function json(is, thing, value, temp) {
                if (is) temp[thing] = JSON.parse(value);
                else temp[thing] = value;
              }
              let temp = {};
              result.forEach(res => {
                for (let i in res) {
                  try {
                    JSON.parse(res[i]);
                    json(true, i, res[i], temp);
                  } catch(err) {
                    json(false, i, res[i], temp);
                  }
                }
                endResult.push(temp);
                number = number+1;
              });
              resolve(endResult);
            }
          });
        } else {
          connection.query(`SELECT * FROM ${name} ORDER BY ${order}`, (err, result, fields) => {
            if (err) reject(err);
            if (result.length === 0) resolve(null);
            else {
              let endResult = [];
              function json(is, thing, value, temp) {
                if (is) temp[thing] = JSON.parse(value);
                else temp[thing] = value;
              }
              let temp = {};
              result.forEach(res => {
                temp = {};
                for (let i in res) {
                  try {
                    JSON.parse(res[i]);
                    json(true, i, res[i], temp);
                  } catch(err) {
                    json(false, i, res[i], temp);
                  }
                }
                endResult.push(temp);
              });
              resolve(endResult);
            }
          });
        }
      });
    });
  }

  // Update
  update(old, n, limit = 1) {
    if (!old) throw "No old thing!";
    if (typeof old !== "object") throw "Invaled old filter!";
    if (isFunctionOfClass(old)) old = old.handle();
    if (!old.limit || !old.divide || !old.filters) throw "Invaled old filter object!";
    if (!isArray(old.filters)) throw "Invaled array for the old filters!";
    old.filters.forEach(f => {
      let valed = false;
      this.columnsArray.forEach(col => {
        if (col === f.column) valed = true;
      });
      if (!valed) throw `Invaled column in the old filter ${f.column}`;
    });
    // Making filter for sql
    let sqlFilterOld = [];
    old.filters.forEach(f => {
      switch (f.action) {
        case "lower":
          f.keyword = `LOWER(${f.keyword})`;
          break;
        case "upper":
          f.keyword = `UPPER(${f.keyword})`;
          break;
        default:
          f.keyword = f.keyword;
      }
      switch (f.type) {
        case "includes":
          sqlFilterOld.push(`\`${f.column}\` LIKE '%${f.keyword}%'`);
          break;
        case "starts":
          sqlFilterOld.push(`\`${f.column}\` LIKE '${f.keyword}%'`);
          break;
        case "ends":
          sqlFilterOld.push(`\`${f.column}\` LIKE '%${f.keyword}'`);
          break;
        case "less":
          sqlFilterOld.push(`\`${f.column}\` < '%${f.keyword}%'`);
          break;
        case "greater":
          sqlFilterOld.push(`\`${f.column}\` > '%${f.keyword}%'`);
          break;
        case "between":
          sqlFilterOld.push(`\`${f.column}\` BETWEEN '${f.keyword[0]}' AND '${f.keyword[1]}'`);
        default:
          sqlFilterOld.push(`\`${f.column}\` = '${f.keyword}'`);
      }
    });

    // New
    if (!n) throw "No new thing!";
    if (typeof n !== "object") throw "Invaled new thing!";
    if (!n.column) throw "No new column!";
    if (!n.value) throw "No new value!";

    // Mysql
    let name = this.name;
    let connection = this.connection;
    let queue = this.queue;
    this.emit("sql", `UPDATE ${name} SET ${n.column} = '${n.value}' WHERE ${sqlFilterOld} LIMIT ${limit}`, "table", "update");
    return new Promise((resolve, reject) => {
      queue.add(() => {
        connection.query(`UPDATE ${name} SET ${n.column} = '${n.value}' WHERE ${sqlFilterOld} LIMIT ${limit}`, (err, result) => {
          if (err) reject(err);
          resolve(`${n.column} = ${n.value}`);
        });
      });
    });
  }

  delete(filter) {
    if (!filter) throw "No old thing!";
    if (typeof filter !== "object") throw "Invaled old filter!";
    if (isFunctionOfClass(filter)) filter = filter.handle();
    if (!filter.limit || !filter.divide || !filter.filters) throw "Invaled old filter object!";
    if (!isArray(filter.filters)) throw "Invaled array for the old filters!";
    filter.filters.forEach(f => {
      let valed = false;
      this.columnsArray.forEach(col => {
        if (col === f.column) valed = true;
      });
      if (!valed) throw `Invaled column in the old filter ${f.column}`;
    });
    // Making filter for sql
    let sqlFilterOld = [];
    filter.filters.forEach(f => {
      switch (f.action) {
        case "lower":
          f.keyword = `LOWER(${f.keyword})`;
          break;
        case "upper":
          f.keyword = `UPPER(${f.keyword})`;
          break;
        default:
          f.keyword = f.keyword;
      }
      switch (f.type) {
        case "includes":
          sqlFilterOld.push(`\`${f.column}\` LIKE '%${f.keyword}%'`);
          break;
        case "starts":
          sqlFilterOld.push(`\`${f.column}\` LIKE '${f.keyword}%'`);
          break;
        case "ends":
          sqlFilterOld.push(`\`${f.column}\` LIKE '%${f.keyword}'`);
          break;
        case "less":
          sqlFilterOld.push(`\`${f.column}\` < '%${f.keyword}%'`);
          break;
        case "greater":
          sqlFilterOld.push(`\`${f.column}\` > '%${f.keyword}%'`);
          break;
        case "between":
          sqlFilterOld.push(`\`${f.column}\` BETWEEN '${f.keyword[0]}' AND '${f.keyword[1]}'`);
        default:
          sqlFilterOld.push(`\`${f.column}\` = '${f.keyword}'`);
      }
    });
    let limit = "";
    if (filter.limit !== 0 && filter.limit !== null) limit = `LIMIT ${filter.limit}`;

    // Mysql
    let name = this.name;
    let connection = this.connection;
    let queue = this.queue;
    this.emit("sql", `DELETE FROM ${name} WHERE ${sqlFilterOld} ${limit}`, "table", "update");
    return new Promise((resolve, reject) => {
      queue.add(() => {
        connection.query(`DELETE FROM ${name} WHERE ${sqlFilterOld} ${limit}`, (err, result) => {
          if (err) reject(err);
          resolve("Deleted!");
        }); 
      });
    });
  }
}
