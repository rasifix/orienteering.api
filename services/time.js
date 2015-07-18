module.exports.reformatTime = function(str) {
  // normalize missing punch time
  if (str === '-' || str === '-----') {
    return '-';
  }
  
  // normalize not working control
  if (str === '0.00') {
    return 's';
  }
  
  // "special" total times (like wrong or missing control)
  if (str.indexOf(':') === -1) {
    return str;
  }
  
  var splits = str.split(':');
  var seconds;
  
  if (splits.length === 3) {
    seconds = parseInt(splits[0], 10) * 3600 + parseInt(splits[1], 10) * 60 + parseInt(sanitize(splits[2]), 10);
  } else if (splits.length === 2) {
    seconds = parseInt(splits[0], 10) * 60 + parseInt(sanitize(splits[1]), 10);
  } else {
    seconds = 0;
  }
  
  return module.exports.formatTime(seconds);
}

var regex = /(-)?[0-9]?[0-9]:[0-9][0-9](:[0-9][0-9])?/;

module.exports.parseTime = function(str) {
  if (!str) {
    return null;
  } else if (typeof str !== 'string') {
    return null;
  } else if (!regex.test(str)) {
    return null;
  }

  var split = str.split(":");
  var result = null;
  if (split.length === 2) {
    var negative = split[0][0] === '-';
    var minutes = parseInt(split[0], 10);
    result = (negative ? -1 : 1) * (Math.abs(minutes) * 60 + parseInt(split[1], 10));
  } else if (split.length === 3) {
    result = parseInt(split[0], 10) * 3600 + parseInt(split[1], 10) * 60 + parseInt(split[2], 10);
  }
  
  return isNaN(result) ? null : result;
}

module.exports.formatTime = function(seconds) {
  if (seconds >= 0) {
    if (seconds >= 3600) {
      return Math.floor(seconds / 3600) + ":" + pad(Math.floor(seconds / 60) % 60) + ":" + pad(seconds % 60);
    }
    return Math.floor(seconds / 60) + ":" + pad(seconds % 60);
  } else {
    return "-" + Math.floor(-seconds / 60) + ":" + pad(-seconds % 60);
  }
}

function pad(value) {
  return value < 10 ? '0' + value : '' + value
}
    
function sanitize(value) {
  var comma = value.indexOf(',');
  if (comma != -1) {
    return value.substring(0, comma);
  } else {
    return value;
  }
}
