// The filter (easy to use in multiple things)

// The class
module.exports = class {
  // The constructor (Triggers at new client.filter)
  constructor(limit, divide) {
    if (!limit) limit = 0;
    if (!divide) divide = "AND";
    this.limit = limit;
    this.setDivide(divide);
    this.filters = [];
  }

  // Set the limit
  setLimit(limit) {
    if (!limit) limit = 0;
    this.limit = limit;
  }

  // Set the divide for individual filters
  setDivide(option) {
    if (!option) throw "No divide option!";
    switch (option.toLowerCase()) {
      case "and":
        this.divide = "AND"
        break;
      case "or":
        this.divide = "OR";
        break;
      default:
        throw "Invaled divide option!";
    }
  }

  // Add a filter
  add(column, keyword, type) {
    if (!column) throw "No column!";
    if (!keyword) throw "No keyword!";
    if (!type) type = "equals";
    if (["equals", "starts", "ends", "less", "greater", "between"])
    // let action = "none";
    // if (action !== "none" && action !== "lower" && action !== "upper") throw "Invaled action!";
    this.id = this.filters.length;
    if (this.id === 0) this.id = 1;
    else this.id = this.id+1;
    this.filters.push({
      id: this.id,
      column: column,
      keyword: keyword,
      type: type
    });
    return this.filters[this.id-1];
  }

  // Chance a filter
  chance(id, object) {
    if (!id) throw "No ID!";
    id = id-1;
    let filterObject = this.filters[id];
    if (!filterObject) throw "Invaled ID!";
    if (!object) throw "No object!";
    if (typeof object !== "object") throw "Invaled object!";
    let valed = false;
    if (object.column) {
      valed = true;
      this.filters[id].column = object.column;
    }
    if (object.keyword) {
      valed = true;
      this.filters[id].keyword = object.keyword;
    }
    if (object.type) {
      valed = true;
      this.filters[id].type = object.type;
    }
    if (object.action) {
      valed = true;
      this.filters[id].action = object.action;
    }
    if (!valed) throw "Invaled object!";
  }

  // Check for the isFunction
  check() {
    return true;
  }

  // Handle the right object
  handle() {
    let endResult = {
      limit: this.limit,
      divide: this.divide,
      filters: []
    };
    this.filters.forEach(filter => {
      endResult.filters.push({
        column: filter.column,
        keyword: filter.keyword,
        type: filter.type
      });
    });
    return endResult;
  }
}
