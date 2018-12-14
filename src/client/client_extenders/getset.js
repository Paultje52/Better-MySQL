// Needed package
const filterClass = require("../filter.js");

// Export
module.exports = function(thing, place) {
  if (place !== "database") throw "You can use the getset extender only in a database!"
  return class {
    // Custructor
    constructor(tableName, memory) {
      if (!tableName) throw "No name!";
      if (typeof memory !== "boolean") memory = true;
      this.memory = memory;
      this.readyState = "not ready";
      this.ready = false;
      thing.getTables().then(async (tables) => {
        if (!tables.includes(tableName)) await thing.createTable(tableName, ["k", "v"]);
        this.columns = await thing.getColumns(tableName);
        if (!this.columns.includes("k" && "v") || this.columns.length > 2) throw `Invaled columns in the table ${tableName}`;
        this.connection = await thing.loadTable(tableName);
        if (memory) {
          this.allData = await this.connection.getAll();
          if (this.allData.length === 0) this.data = {};
          else {
            this.data = {};
              function json(is, thing, value, data) {
                if (is) data[thing] = JSON.parse(value);
                else data[thing] = value;
              }
            this.allData.forEach(data => {
              try {
                JSON.parse(data.v);
                json(true, data.k, data.v, this.data);
              } catch(err) {
                json(false, data.k, data.v, this.data);
              }
            });
          }
        }
        this.readyState = "ready";
        this.ready = true;
      });
    }

    // Waiting until ready
    waitForReady() {
      return new Promise((resolve, reject) => {
        setInterval(() => {
          if (this.ready) return resolve(true);
        }, 250);
      });
    }

    // Get
    get(key, path) {
      if (!key) throw "No key!";
      if (this.memory) {
        let data;
        if (!key.includes(".")) data = this.data[key];
        else data = this.data[key.split(".")[0]][key.split(".").slice(1)];
        return data;
      } else {
        let connection = this.connection;
        return new Promise(async (resolve, reject) => {
          let filter = new filterClass(1);
          filter.add("k", key);
          let result = await connection.where(filter);
          if (result.length === 0) resolve(undefined);
          else {
            function json(type, res) {
              if (!type) resolve(res);
              if (!path) resolve(res);
              resolve(res[path]);
            }
            try {
              JSON.parse(result[0].v);
              json(true, JSON.parse(result[0].v));
            } catch(err) {
              json(false, result[0].v);
            }
          }
        });
      }
    }

    // Set
    set(key, value, path) {
      if (!key) throw "No key to set!";
      if (!value) throw "No value to set!";
      if (this.memory) {
        let exits = false;
        if (key.includes(".")) {
          if (this.data[key.split(".")[0]][key.split(".").slice(1)]) exits = true;
        } else if (this.data[key]) exits = true;
        if (key.includes(".")) this.data[key.split(".")[0]][key.split(".").slice(1)] = value;
        else this.data[key] = value;
        let filter = new filterClass(1);
        if (key.includes(".")) filter.add("k", key.split(".")[0]);
        else filter.add("k", key);
        if (exits) this.connection.update(filter, {column: "v", value: value});
        else this.connection.add([key, value]);
        return value;
      } else {
        let connection = this.connection;
        return new Promise(async (resolve, reject) => {
          let filter = new filterClass(1);
          filter.add("k", key);
          let res = await connection.where(filter);
          if (res.length === 0) await connection.add([key, value]);
          else {
            if (path) {
              res[path] = value;
              await connection.update(filter, {column: "v", value: res});
            } else await connection.update(filter, {column: "v", value: value});
          }
          resolve(value);
        });
      }
    }

    // Delete
    delete(key, path) {
      if (!key) throw "No key to delete!";
      if (this.memory) {
        let filter = new filterClass(1);
        let temp = "TEMP";
        if (key.includes(".")) {
          if (!this.data[key.split(".")[0]][key.split(".").slice(1)]) throw "Invaled key!";
          temp = this.data[key.split(".")[0]][key.split(".").slice(1)];
          delete this.data[key.split(".")[0]][key.split(".").slice(1)];
          filter.add("k", key.split(".")[0]);
        } else {
          console.log(this.data);
          if (!this.data[key]) throw "Invaled key!";
          temp = this.data[key];
          delete this.data[key];
          filter.add("k", key);
        }
        if (!key.includes(".")) this.connection.delete(filter);
        else this.connection.update(filter, this.data[key.split(".")[0]][key.split(".").slice(1)]);
        return temp;
      } else {
        let connection = this.connection;
        return new Promise(async (resolve, reject) => {
          let filter = new filterClass(1);
          filter.add("k", key);
          let res = await connection.where(filter);
          if (res.length === 0) throw "Invaled key!";
          res = res[0].v;
          if (path) {
            if (typeof res !== "object" || !res[path]) throw "Invaled path!";
            let temp = res[path];
            delete res[path];
            await connection.update(filter, {column: "v", value: res});
            resolve(res);
          } else {
            await connection.delete(filter);
            resolve(res);
          }
        });
      }
    }
  }
}
