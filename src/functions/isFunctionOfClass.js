module.exports = function(thing) {
  try {
    let result = thing.check();
    if (!result) return false;
    return true;
  } catch(err) {
    return false;
  }
}
