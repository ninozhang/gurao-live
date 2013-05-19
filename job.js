var _ = require('underscore'),
    async = require('async'),
    CronJob = require('cron').CronJob,
    config = require('./config'),
    forecast = require('./forecast'),
    live = require('./live'),
    weibo = require('./weibo');

exports.updateForecast = function() {
    forecast.update();
};

exports.addForecastBlog = function(city) {
    async.parallel({
        forecast: function(callback){
            forecast.getLatest(city, function(data) {
                var date = new Date(data.date),
                    msg = '【潮阳天气】';
                msg += (date.getMonth() + 1) + '月' + date.getDate() + '日，';
                msg += data.weather1 + '，';
                msg += '气温：' + data.temp_low1 + '℃~' + data.temp_high1 + '℃，';
                msg += data.wind1 + '。';
                msg += '明日：' + data.weather2 + '，'; 
                msg += '气温：' + data.temp_low1 + '℃~' + data.temp_high1 + '℃，';
                msg += data.wind2 + '。';
                msg += '详情：http://t.cn/hBqsJ3。';
                callback(null, msg);
            });
        },
        live: function(callback) {
            live.getLatest(null, function(data) {
                callback(null, data);
            });
        },
        login: function(callback){
            weibo.login(function(data) {
                callback(null, data);
            });
        }
    },
    function(err, results) {
        var forecast = results.forecast,
            live = results.live,
            login = results.login;
        if (!forecast) {
            console.warn('Add Forecast Blog Error: ', forecast);
            return;
        }
        if (live) {
            weibo.addPic(live, function(url) {
                weibo.addBlog(forecast, url, function(id) {
                    console.log('Add Forecast Blog Success.', id);
                }, function(e) {
                    console.warn('Add Forecast Blog Error: ', e);
                });
            });
        } else {
            weibo.addBlog(forecast, function(id) {
                console.log('Add Forecast Blog Success.', id);
            }, function(e) {
                console.warn('Add Forecast Blog Error: ', e);
            });
        }
    });
}

exports.start = function() {
    console.log('Job Start...');

    var jobs = config.jobs;
    _.each(jobs, function(job) {
        var name = job.name,
            fn = exports[job.fn],
            args = job.args,
            interval = job.interval,
            cron = job.cron;
        if (!fn) {
            return;
        }
        if (interval) {
            setInterval(function() {
                console.info('---Running Job: ', name);
                fn.apply(null, args);
            }, interval);
            console.log('Set Up Job: ', name, ' interval:', interval);
        }
        if (cron) {
            new CronJob(cron, function() {
                console.info('---Running Job: ', name);
                fn.apply(null, args);
            }, function () {
                // This function is executed when the job stops
            }, true);
            console.log('Set Up Job: ', name, ' cron:', cron);
        }
    });
}