var _ = require('underscore'),
    async = require('async');

var getLatest = exports.getLatest = function (id, callback) {
    if (callback) {
        callback();
    }
};