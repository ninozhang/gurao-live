var _ = require('underscore'),
    async = require('async'),
    get = require('get'),
    db = require('./db'),
    config = require('./config'),
    log = require('./log');

var update = exports.update = function (callback) {
    var forecast = config.forecast,
        url = forecast.url,
        replacement = forecast.replacement,
        cities = forecast.cities;
    _.each(cities, function (city) {
        async.parallel({
            data: function (callback) {
                get({ uri: url.replace(replacement, city) }).asString(function (err, data) {
                    if (err) throw err;
                    var json = JSON.parse(data);
                    data = json2data(json.weatherinfo);
                    log.debug('抓取[', city, ']新天气预报：', data);
                    callback(null, data);
                });
            },
            last: function (callback) {
                var cb = function (data) {
                    log.debug('数据库[', city, ']最新天气预报：', data);
                    callback(null, data);
                };
                getLatest(city, cb);
            }
        },
        function (err, results) {
            var data = results.data,
                last = results.last,
                updated = false;
            _.each(data, function (value, name) {
                if (name == 'id') {
                    return;
                }
                if (!last || last[name] != data[name]) {
                    updated = true;
                }
            });
            if (updated) {
                log.info('[', data.city_code, ']预报有更新，插入数据库');
                db.save('forecast', data);
                if (callback) {
                    callback(data);
                }
            } else {
                log.info('[', data.city_code, ']预报无更新');
                if (callback) {
                    callback(data);
                }
            }
        });
    });
};

var getLatest = exports.getLatest = function (city, callback) {
    var sql = 'SELECT * FROM forecast WHERE city_code = ' + city + ' ORDER BY id DESC LIMIT 1';

    db.query(sql, function (rows, fields) {
        if (callback) {
            callback(rows[0]);
        }
    });
};

function getTemp(temp) {
    return {
        a: temp.substring(0, temp.indexOf('℃')),
        b: temp.substring(temp.indexOf('~') + 1, temp.length - 1)
    };
}

function getTempLow(temp) {
    var t = getTemp(temp);
    return t.a < t.b ? t.a : t.b;
}

function getTempHigh(temp) {
    var t = getTemp(temp);
    return t.a > t.b ? t.a : t.b;
}

function json2data(f) {
    return {
        city_code: f.cityid,
        city_name: f.city,
        date: new Date(f.date_y.replace('年', '/').replace('月', '/').replace('日', '')).toString(),
        temp_low1: getTempLow(f.temp1),
        temp_high1: getTempHigh(f.temp1),
        weather1: f.weather1,
        wind1: f.wind1,
        wind_dir1: f.fx1,
        wind_speed1: f.fl1,
        temp_low2: getTempLow(f.temp2),
        temp_high2: getTempHigh(f.temp2),
        weather2: f.weather2,
        wind2: f.wind2,
        wind_dir2: f.fx2,
        wind_speed2: f.fl2,
        temp_low3: getTempLow(f.temp3),
        temp_high3: getTempHigh(f.temp3),
        weather3: f.weather3,
        wind3: f.wind3,
        wind_speed3: f.fl3,
        temp_low4: getTempLow(f.temp4),
        temp_high4: getTempHigh(f.temp4),
        weather4: f.weather4,
        wind4: f.wind4,
        wind_speed4: f.fl4,
        temp_low5: getTempLow(f.temp5),
        temp_high5: getTempHigh(f.temp5),
        weather5: f.weather5,
        wind5: f.wind5,
        wind_speed5: f.fl5,
        temp_low6: getTempLow(f.temp6),
        temp_high6: getTempHigh(f.temp6),
        weather6: f.weather6,
        wind6: f.wind6,
        wind_speed6: f.fl6,
        index: f.index,
        index_dress: f.index_d,
        index_uv: f.index_uv,
        index_car: f.index_xc,
        index_travel: f.index_tr,
        index_comfort: f.index_co,
        index_exercise: f.index_cl,
        index_drying: f.index_ls,
        index_allergy: f.index_ag,
        index48: f.index48,
        index48_dress: f.index48_d,
        index48_uv: f.index_uv
    };
}