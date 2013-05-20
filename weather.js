var _ = require('underscore'),
    async = require('async'),
    db = require('./db'),
    config = require('./config').weather,
    FetchStream = require("fetch").FetchStream,
    fs = require("fs"),
    folder = config.folder || fs.realpathSync('.') + '/downloads/';

// 24小时降水
exports.js24 = function () {
    update();

    var type = 'js24',
        filename = g.yyyy + g.MM + g.dd + g.hh + g.mm + '02400' + '.JPG',
        url = prefix +
                'STFC/SEVP_NMC_STFC_SFER_ER24_ACHN_L88_P9_' +
                filename;

    console.log('抓取【24小时降水】图，', url);
    fetchWeather(type, filename, url);
};

// 48小时降水
exports.js48 = function () {
    update();

    var type = 'js48',
        filename = g.yyyy + g.MM + g.dd + g.hh + g.mm + '04800' + '.JPG',
        url = prefix +
                'STFC/SEVP_NMC_STFC_SFER_ER24_ACHN_L88_P9_' +
                filename;

    console.log('抓取【48小时降水】图，', url);
    fetchWeather(type, filename, url);
};

// 72小时降水
exports.js72 = function () {
    update();

    var type = 'js72',
        filename = g.yyyy + g.MM + g.dd + g.hh + g.mm + '07200' + '.JPG',
        url = prefix +
                'STFC/SEVP_NMC_STFC_SFER_ER24_ACHN_L88_P9_' +
                filename;

    console.log('抓取【72小时降水】图，', url);
    fetchWeather(type, filename, url);
};

// 1小时温度
exports.wd1 = function () {
    update();

    var type = 'wd1',
        filename = fulltime + '.JPG',
        url = prefix +
                'STFC/SEVP_NMC_STFC_SFER_ET0_ACHN_L88_PB_' +
                filename;

    console.log('抓取【1小时温度】图，', url);
    fetchWeather(type, filename, url);
};

// 1小时风场
exports.fc1 = function () {
    update();

    var type = 'fc1',
        filename = fulltime + '.JPG',
        url = prefix +
                'STFC/SEVP_NMC_STFC_SFER_EDA_ACHN_L88_PB_' +
                filename;

    console.log('抓取【1小时风场】图，', url);
    fetchWeather(type, filename, url);
};

// 1小时降水
exports.js1 = function () {
    update();

    var type = 'js1',
        filename = fulltime + '.JPG',
        url = prefix +
                'STFC/SEVP_NMC_STFC_SFER_ER1_ACHN_L88_PB_' +
                filename;

    console.log('抓取【1小时降水】图，', url);
    fetchWeather(type, filename, url);
};

// 雷暴天气
exports.lbtq = function () {
    update();

    var type = 'lbtq',
        filename = fulltime + '.JPG',
        url = prefix +
                'WEAP/SEVP_NMC_WEAP_SOB_EEB_ACHN_LNO_PE_' +
                filename;

    console.log('抓取【雷暴天气】图，', url);
    fetchWeather(type, filename, url);
};

// 广州雷达
exports.gzld = function () {
    var c = getCommon(10 * 60000),
        type = 'gzld',
        filename = c.fulltime + '.GIF',
        url = c.prefix +
                'RDCP/SEVP_AOC_RDCP_SLDAS_EBREF_AZ9200_L88_PI_' +
                filename;


    console.log('抓取【广州雷达】图，', url);
    fetchWeather(type, filename, url);
};

// 汕头雷达
exports.stld = function () {
    var c = getCommon(10 * 60000),
        type = 'stld',
        filename = c.fulltime + '.GIF',
        url = c.prefix +
                'RDCP/SEVP_AOC_RDCP_SLDAS_EBREF_AZ9754_L88_PI_' +
                filename;


    console.log('抓取【汕头雷达】图，', url);
    fetchWeather(type, filename, url);
};

// 卫星云图
exports.wxyt = function () {
    update();

    var type = 'wxyt',
        filename = fulltime + '.JPG',
        url = prefix +
                'WXCL/SEVP_NSMC_WXCL_ASC_E99_ACHN_LNO_PY_' +
                filename;

    console.log('抓取【卫星云图】图，', url);
    fetchWeather(type, filename, url);
};

// 华南雷达拼图
exports.hnldpt = function () {
    update();

    var type = 'hnldpt',
        filename = fulltime + '.JPG',
        url = prefix +
                'RDCP/SEVP_NMC_RDCP_SLDAS_EZ9_ASCN_L88_PI_' +
                filename;

    console.log('抓取【华南雷达拼图】图，', url);
    fetchWeather(type, filename, url);
};

// 全国雷达拼图
exports.qgldpt = function () {
    update();

    var type = 'qgldpt',
        filename = fulltime + '.JPG',
        url = prefix +
                'RDCP/SEVP_NMC_RDCP_SLDAS_EZ9_ACHN_L88_PI_' +
                filename;

    console.log('抓取【全国雷达拼图】图，', url);
    fetchWeather(type, filename, url);
};

// 抓取图片逻辑
function fetchWeather(type, filename, url) {
    var outpath = folder + type + '/' + filename,
        stream,
        status,
        contentType,
        contentLength = 0;

    var fetch = new FetchStream(url);
    fetch.on('meta', function (meta) {
        status = meta.status;
        contentType = meta.responseHeaders['content-length'];
        contentLength = meta.responseHeaders['content-length'];
    });
    fetch.on('end', function () {
        if (status == 200) {
            stream = fs.createWriteStream(filename);
            fetch.pipe(stream);
            console.log('图片保存到: ', outpath);

            saveWeather(type, filename, contentLength);
        }
    });
}

// 保存天气实况图
function saveWeather(type, filename, bytes) {
    var data = {
        type: type,
        key: filename,
        bytes: bytes,
        time: new Date()
    };
    db.save('weather', data);
}

// 更新时间
function getCommon(offset) {
    var date = new Date(Date.now() - offset),
        d = parseDate(date),
        gmt =  new Date(Date.now() - 8 * 3600000 - offset),
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