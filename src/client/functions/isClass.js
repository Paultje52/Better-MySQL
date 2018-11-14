module.exports = function(object, data) {
  if (!object) throw "No object to check!";
  try {
    if (!data) new object();
    else new object(data);
    return true;
  } catch(err) {
    return false;
  }
}
