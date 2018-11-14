module.exports = function(object) {
  try {
    object.forEach(obj => {});
    return true;
  } catch(err) {
    return false;
  }
}
