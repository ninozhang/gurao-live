var _ = require('underscore'),
    fs = require('fs'),
    Log = require('log'),
    level = 'debug',
    dir = fs.realpathSync('.') + '/logs/',
    log;

function getLog() {
    if (!log) {
        newLog();
    }
    return log;
}

function toLog(args) {
    var array = Array.prototype.slice.apply(args);
    array.forEach(function(value, index) {
        if (_.isObject(value)) {
            array[index] = JSON.stringify(value);
        }
    });
    return array.join(' ');
}

var newLog = exports.newLog = function () {
    var date = new Date(),
        filename = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + '.log',
        stream = fs.createWriteStream(dir + filename);
    log = new Log(level, stream);
};

var consoleFn = ['log', 'info', 'info', 'warn', 'error', 'error', 'error', 'error'];
['debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency'].forEach(function(fn, i) {
    exports[fn] = function() {
        var log = getLog(),
            content = toLog(arguments);
        console[consoleFn[i]](content);
        log[fn](content);
    };
});