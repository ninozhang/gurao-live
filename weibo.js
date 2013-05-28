var _ = require('underscore'),
    fs = require('fs'),
    http = require('http'),
    https = require('https'),
    qs = require('querystring'),
    config = require('./config').weibo,
    log = require('./log'),
    cookies = {},
    cookieString;

function updateCookie(setCookie) {
    if (setCookie) {
        var changed = false;
        setCookie.forEach(function (cookie, i) {
            var kv = cookie.split(';')[0],
                key = kv.split('=')[0],
                value = kv.split('=')[1];
            if (key && value) {
                cookies[key] = value;
                changed = true;
            }
        });
        if (changed) {
            cookieString = '';
            _.each(cookies, function (value, key) {
                cookieString += key + '=' + value + ';';
            });
        }
    }
}

function makeOptions(path, method, headers) {
    var options = {
            host: config.host,
            path: path,
            method: method,
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Charset': 'UTF-8,*;q=0.5',
                'Accept-Language': 'zh-CN,zh;q=0.8',
                'Connection': 'keep-alive',
                'DNT': '1',
                'Host':'m.weibo.cn',
                'Origin': 'https://m.weibo.cn',
                'Pragma': 'no-cache',
                'Referer': 'https://m.weibo.cn',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_3) AppleWebKit/537.31 (KHTML, like Gecko) Chrome/26.0.1410.65 Safari/537.31',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

    if (cookieString) {
        options.headers['Cookie'] = cookieString;
    }

    _.extend(options.headers, headers);

    return options;
}

function request(path, method, data, callback, error) {
    if (_.isFunction(data)) {
        error = callback;
        callback = data;
        data = null;
    }
    if (_.isObject(data)) {
        data = qs.stringify(data);
    }

    var dataLength = 0;
    if (data) {
        dataLength = data.length;
    }

    var options = makeOptions(path, method, {'Content-Length': dataLength}),
        req = https.request(options, function (res) {
            var chunks = [];
            res.on('data', function (chunk) {
                if (chunk) {
                    chunks.push(chunk);
                }
            });
            res.on('end', function () {
                updateCookie(res.headers['set-cookie']);
                log.info('微博API接口请求成功。');
                var data = Buffer.concat(chunks).toString();
                if (data) {
                    try {
                        data = JSON.parse(data);
                    } catch(e) {
                        log.error('微博API接口数据解析失败。', e);
                    }
                }
                if (callback) {
                    callback(data);
                }
            });
            res.on('error', function (e) {
                log.warn('微博接口返回出错。', e);
                if (error) {
                    error(e);
                }
            });
        });

    if (data) {
        req.write(data);
    }

    req.on('error', function (e) {
        log.warn('微博接口请求出错。', e);
        if (error) {
            error(e);
        }
    });

    log.debug('微博请求数据：', data);
    log.debug('微博请求cookie：', cookieString);
    req.end();

    return req;
}

function get(path, data, callback, error) {
    request(path, 'GET', data, callback, error);
}

function post(path, data, callback, error) {
    request(path, 'POST', data, callback, error);
}

function upload(path, filepath, callback, error) {
    var filedata = fs.readFileSync(filepath),
        crlf = "\r\n",
        boundaryKey = 'weibo' + Math.random().toString(16),
        delimiter = crlf + "--" + boundaryKey,
        preamble = "", // ignored. a good place for non-standard mime info
        epilogue = "", // ignored. a good place to place a checksum, etc
        headers = [
            'Content-Type: image/jpeg' + crlf,
            'Content-Disposition: form-data; name="pic"; filename="pic.jpg"' + crlf
        ],
        closeDelimiter = delimiter + "--",
        multipartBody;

    multipartBody = Buffer.concat([
        new Buffer(preamble + delimiter + crlf + headers.join('') + crlf),
        filedata,
        new Buffer(closeDelimiter + epilogue)
    ]);

    var options = makeOptions(path, 'POST', {
            'Origin': 'http://m.weibo.cn',
            'Referer': 'http://m.weibo.cn',
            'Content-Length': multipartBody.length,
            'Content-Type': 'multipart/form-data; boundary=' + boundaryKey
        }),
        req = http.request(options, function (res) {
            var chunks = [];
            res.on('data', function (chunk) {
                if (chunk) {
                    chunks.push(chunk);
                }
            });
            res.on('end', function () {
                log.info('微博图片上传接口请求成功。');
                var data = Buffer.concat(chunks).toString();
                if (callback) {
                    callback(data);
                }
            });
            res.on('error', function (e) {
                log.warn('微博图片上传接口返回出错。', e);
                if (error) {
                    error(e);
                }
            });
        });

    req.on('error', function (e) {
        log.warn('微博图片上传接口请求出错。', e);
        if (error) {
            error(e);
        }
    });

    req.write(multipartBody);
    req.end();

    return req;
}

var login = exports.login = function (callback, error) {
    log.info('登录微博。');
    post('/login', {
            'check' : '1',
            'backURL' : '/',
            'uname' : config.user,
            'pwd' : config.password,
            'autoLogin' : '1'
        }, callback, error);
};

var getHomeData = exports.getHomeData = function (callback, error) {
    log.info('获取首页数据。');
    get('/home/homeData?page=1&', callback, error);
};

var getUserInfo = exports.getUserInfo = function (callback, error) {
    log.info('获取用户信息。');
    getHomeData(function (data) {
        if (callback) {
            callback(data.userInfo);
        }
    }, error);
};

var addPic = exports.addPic = function (filepath, callback, error) {
    upload('/mblogDeal/addPic?id=0', filepath, function (data) {
        if (!callback) {
            return;
        }
        var start = data.indexOf('http:/'),
            end = data.indexOf('\',\'\')'),
            url = data.substring(start, end);
        log.info('上传图片到微博：', url);
        callback(url);
    }, error);
};

var addBlog = exports.addBlog = function (content, pic, callback, error) {
    if (_.isFunction(pic)) {
        error = callback;
        callback = pic;
        pic = null;
    }

    var nickname = config.nickname,
        maxLen = 140 - nickname.length,
        data = {};

    data.content = content.substring(0, maxLen) + '@' + nickname;
    if (pic) {
        data.picFile = pic;
    }
    log.info('发布微博：', JSON.stringify(data));

    post('/mblogDeal/addAMblog?st=b1f8', data, function (data) {
        if (!callback) {
            return;
        }
        if (_.isString(data)) {
            var success = data.indexOf('"ok":1') > 0,
                start = data.indexOf('"id":"') + 6,
                end = data.indexOf('","ok":'),
                id;
            if (start > 0 && end > 0) {
                id = data.substring(start, end);
            }
            callback(id);
        }
    }, error);
};