var _ = require('underscore'),
    mysql = require('mysql'),
    db = require('./config').db;

var getConn = exports.getConn = function () {
    var conn = mysql.createConnection({
        host: db.host,
        database: db.database,
        user: db.user,
        password: db.password
    });

    conn.connect();

    return conn;
};

exports.query = function (sql, callback, error) {
    var conn = getConn();

    conn.query(sql, function (e, rows, fields) {
        if (e) {
            if (error) {
                error(e);
            }
            throw e;
        }

        if (callback) {
            callback(rows, fields);
        }
    });

    conn.end();
};

exports.save = function (table, data, callback, error) {
    var conn = getConn();

    conn.query('INSERT INTO ' + table + ' SET ?', data, function (e, result) {
        if (e) {
            if (error) {
                error(e);
            }
            throw e;
        }

        if (callback) {
            callback(result);
        }
    });

    conn.end();
};