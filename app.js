var async = require('async'),
    forecast = require('./forecast'),
    weibo = require('./weibo'),
    job = require('./job'),
    log = require('./log');

log.info('程序启动...');

job.start();