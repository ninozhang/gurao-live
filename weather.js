var _ = require('underscore'),
    async = require('async'),
    db = require('./db'),
    config = require('./config').weather,
    FetchStream = require("fetch").FetchStream,
    fs = require("fs"),
    log = require('./log'),
    folder = config.folder || (fs.realpathSync('.') + '/downloads/');

// 24小时降水
exports.js24 = function () {
    var c = getCommon(60, 20 * 60000),
        g = c.g,
        type = 'js24',
        filename = g.yyyy + g.MM + g.dd + g.hh + g.mm + '02400' + '.JPG',
        url = c.prefix +
                'STFC/SEVP_NMC_STFC_SFER_ER24_ACHN_L88_P9_' +
                filename;

    log.debug('抓取【24小时降水】图，', url);
    fetchWeather(type, filename, url);
};

// 48小时降水
exports.js48 = function () {
    var c = getCommon(60, 20 * 60000),
        g = c.g,
        type = 'js48',
        filename = g.yyyy + g.MM + g.dd + g.hh + g.mm + '04800' + '.JPG',
        url = c.prefix +
                'STFC/SEVP_NMC_STFC_SFER_ER24_ACHN_L88_P9_' +
                filename;

    log.debug('抓取【48小时降水】图，', url);
    fetchWeather(type, filename, url);
};

// 72小时降水
exports.js72 = function () {
    var c = getCommon(60, 20 * 60000),
        g = c.g,
        type = 'js72',
        filename = g.yyyy + g.MM + g.dd + g.hh + g.mm + '07200' + '.JPG',
        url = c.prefix +
                'STFC/SEVP_NMC_STFC_SFER_ER24_ACHN_L88_P9_' +
                filename;

    log.debug('抓取【72小时降水】图，', url);
    fetchWeather(type, filename, url);
};

// 1小时温度
exports.wd1 = function () {
    var c = getCommon(60, 20 * 60000),
        type = 'wd1',
        filename = fulltime + '.JPG',
        url = c.prefix +
                'STFC/SEVP_NMC_STFC_SFER_ET0_ACHN_L88_PB_' +
                filename;

    log.debug('抓取【1小时温度】图，', url);
    fetchWeather(type, filename, url);
};

// 1小时风场
exports.fc1 = function () {
    var c = getCommon(60, 20 * 60000),
        type = 'fc1',
        filename = fulltime + '.JPG',
        url = c.prefix +
                'STFC/SEVP_NMC_STFC_SFER_EDA_ACHN_L88_PB_' +
                filename;

    log.debug('抓取【1小时风场】图，', url);
    fetchWeather(type, filename, url);
};

// 1小时降水
exports.js1 = function () {
    var c = getCommon(60, 20 * 60000),
        type = 'js1',
        filename = c.fulltime + '.JPG',
        url = c.prefix +
                'STFC/SEVP_NMC_STFC_SFER_ER1_ACHN_L88_PB_' +
                filename;

    log.debug('抓取【1小时降水】图，', url);
    fetchWeather(type, filename, url);
};

// 广州雷达
exports.gzld = function () {
    var c = getCommon(5, 10 * 60000),
        type = 'gzld',
        filename = c.fulltime + '.GIF',
        url = c.prefix +
                'RDCP/SEVP_AOC_RDCP_SLDAS_EBREF_AZ9200_L88_PI_' +
                filename;


    log.debug('抓取【广州雷达】图，', url);
    fetchWeather(type, filename, url);
};

// 汕头雷达
exports.stld = function () {
    var c = getCommon(5, 10 * 60000),
        type = 'stld',
        filename = c.fulltime + '.GIF',
        url = c.prefix +
                'RDCP/SEVP_AOC_RDCP_SLDAS_EBREF_AZ9754_L88_PI_' +
                filename;


    log.debug('抓取【汕头雷达】图，', url);
    fetchWeather(type, filename, url);
};

// 卫星云图
exports.wxyt = function () {
    var c = getCommon(30, 70 * 60000),
        type = 'wxyt',
        filename = c.fulltime + '.JPG',
        url = c.prefix +
                'WXCL/SEVP_NSMC_WXCL_ASC_E99_ACHN_LNO_PY_' +
                filename;

    log.debug('抓取【卫星云图】图，', url);
    fetchWeather(type, filename, url);
};

// 华南雷达拼图
exports.hnldpt = function () {
    var c = getCommon(10, 40 * 60000),
        type = 'hnldpt',
        filename = c.fulltime + '.JPG',
        url = c.prefix +
                'RDCP/SEVP_NMC_RDCP_SLDAS_EZ9_ASCN_L88_PI_' +
                filename;

    log.debug('抓取【华南雷达拼图】图，', url);
    fetchWeather(type, filename, url);
};

// 全国雷达拼图
exports.qgldpt = function () {
    var c = getCommon(10, 40 * 60000),
        type = 'qgldpt',
        filename = c.fulltime + '.JPG',
        url = c.prefix +
                'RDCP/SEVP_NMC_RDCP_SLDAS_EZ9_ACHN_L88_PI_' +
                filename;

    log.debug('抓取【全国雷达拼图】图，', url);
    fetchWeather(type, filename, url);
};

// 抓取图片逻辑
function fetchWeather(type, filename, url) {
    var date = new Date(),
        typeDir = folder + type + '/',
        dailyDir = typeDir + date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + '/',
        outpath = dailyDir + filename,
        stream,
        status,
        contentType,
        contentLength = 0;

    if (fileSize(outpath) > 10000) {
        log.debug('天气实况图片已存在：', type + '/' + filename);
        return;
    }

    if (!fs.existsSync(typeDir)) {
        log.debug('创建目录：', typeDir);
        fs.mkdirSync(typeDir);
    }

    if (!fs.existsSync(dailyDir)) {
        log.debug('创建目录：', dailyDir);
        fs.mkdirSync(dailyDir);
    }

    var fetch = new FetchStream(url);
    stream = fs.createWriteStream(outpath);
    fetch.pipe(stream);
    fetch.on('meta', function (meta) {
        status = meta.status;
        contentType = meta.responseHeaders['content-type'];
        contentLength = meta.responseHeaders['content-length'];
    });
    fetch.on('end', function () {
        if (status == 200 && fileSize(outpath) > 10000) {
            log.debug('天气实况图片保存到：', type + '/' + filename);
            saveWeather(type, filename, contentType, contentLength);
        } else {
            fs.unlinkSync(outpath);
        }
    });
}

// 保存天气实况图
function saveWeather(type, filename, contentType, bytes) {
    var data = {
        type: type,
        key: filename,
        content_type: contentType,
        bytes: bytes,
        time: new Date()
    };
    db.save('weather', data);
}

// 更新时间
function getCommon(step, delay) {
    var gmt = new Date(Date.now() - 8 * 3600000 - delay),
        minutes = gmt.getMinutes() - (gmt.getMinutes() % step);
    gmt.setMinutes(minutes, 0, 0);

    var date = new Date(Date.now()- delay),
        d = parseDate(date),
        g = parseDate(gmt),
        fulltime = g.yyyy + g.MM + g.dd + g.hh + g.mm + g.ss + g.SSS,
        prefix = 'http://image.weather.gov.cn/product/' + d.yyyy + '/' +
                d.yyyy + d.MM + '/' + d.yyyy + d.MM + d.dd + '/';
    return {
        date: date,
        d: d,
        gmt: gmt,
        g: g,
        fulltime: fulltime,
        prefix: prefix
    };
}

// 分解时间
function parseDate(d) {
    yyyy = d.getFullYear();
    MM = d.getMonth() + 1;
    if (MM < 10) {
        MM = '0' + MM;
    }
    dd = d.getDate();
    if (dd < 10) {
        dd = '0' + dd;
    }
    hh = d.getHours();
    if (hh < 10) {
        hh = '0' + hh;
    }
    mm = d.getMinutes();
    if (mm < 10) {
        mm = '0' + mm;
    }
    return {
        yyyy: yyyy,
        MM: MM,
        dd: dd,
        hh: hh,
        mm: mm,
        ss: '00',
        SSS: '000'
    };
}

// 读取图片大小
function fileSize(path) {
    var size = 0;
    if (fs.existsSync(path)) {
        var stat = fs.statSync(path);
        size = stat.size;
    }
    return size;
}