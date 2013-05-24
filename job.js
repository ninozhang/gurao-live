var _ = require('underscore'),
    async = require('async'),
    CronJob = require('cron').CronJob,
    config = require('./config'),
    forecast = require('./forecast'),
    weather = require('./weather'),
    live = require('./live'),
    log = require('./log'),
    weibo = require('./weibo'),
    backup = require('./backup');

exports.start = function () {
    log.info('开始新增定时任务...');

    var jobs = config.jobs;
    _.each(jobs, function (job) {
        var name = job.name,
            fn = exports[job.fn],
            args = job.args || [],
            interval = job.interval,
            cron = job.cron;
        if (!fn) {
            return;
        }
        if (interval) {
            setInterval(function () {
                log.info('---执行任务: ', name);
                fn.apply(null, args);
            }, interval);
            log.info('新增定时任务: ', name, ' 间隔时间:', interval);
        }
        if (cron) {
            new CronJob(cron, function () {
                log.info('---执行任务: ', name);
                fn.apply(null, args);
            }, function () {
                // This function is executed when the job stops
            }, true);
            log.info('新增定时任务: ', name, ' Cron:', cron);
        }
    });
};

exports.updateForecast = function () {
    forecast.update();
};

exports.newLog = function () {
    log.newLog();
};

exports.addForecastBlog = function (city) {
    async.parallel({
        forecast: function (callback){
            forecast.getLatest(city, function (data) {
                var date = new Date(data.date),
                    msg = '【潮阳天气】';
                msg += (date.getMonth() + 1) + '月' + date.getDate() + '日，';
                msg += data.weather1 + '，';
                msg += '气温：' + data.temp_low1 + '℃~' + data.temp_high1 + '℃，';
                msg += data.wind1 + '。';
                msg += '明日，' + data.weather2 + '，'; 
                msg += '气温：' + data.temp_low1 + '℃~' + data.temp_high1 + '℃，';
                msg += data.wind2 + '。';
                msg += '详情：http://t.cn/hBqsJ3。';
                callback(null, msg);
            });
        },
        live: function (callback) {
            live.getLatest(null, function (data) {
                callback(null, data);
            });
        },
        login: function (callback){
            weibo.login(function (data) {
                callback(null, data);
            });
        }
    },
    function (err, results) {
        var forecast = results.forecast,
            live = results.live,
            login = results.login;
        if (!forecast) {
            log.warn('发布预报微博出错，预报为空。', forecast);
            return;
        }
        if (live) {
            weibo.addPic(live, function (url) {
                weibo.addBlog(forecast, url, function (id) {
                    log.info('发布预报微博成功。', id);
                }, function (e) {
                    log.warn('发布预报微博失败。', e);
                });
            });
        } else {
            weibo.addBlog(forecast, function (id) {
                log.info('发布预报微博成功。', id);
            }, function (e) {
                log.warn('发布预报微博失败。', e);
            });
        }
    });
};

exports.fetchWeather = function (fn) {
    weather[fn]();
};

exports.backup = function () {
    backup.log();
    backup.weather();
};