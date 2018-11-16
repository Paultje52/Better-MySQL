// Queue
module.exports = class {
  constructor(interval) {
    if (!interval) interval = 500;
    this.interval = interval;
    this.queue = [];

    this.interval = setInterval(async () => {
      if (this.queue.length === 0) return;
      await this.queue[0]();
      this.queue.shift();
    }, this.interval);
  }

  add(func) {
    this.queue.push(func);
  }

  clear() {
    this.queue = [];
  }

  stop() {
    clearInterval(this.interval);
  }

  start() {
    this.interval = setInterval(async () => {
      if (this.queue.length === 0) return;
      await queue[0]();
      queue.shift();
    }, this.interval);
  }
}
