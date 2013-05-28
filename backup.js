var file = require('file'),
	fs = require('fs'),
	pack = require('./pack'),
	log = require('./log'),
    mail = require('./mail'),
	root = fs.realpathSync('.') + '/';

function isIgnore(filename) {
    var date = new Date(),
        ignore = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    return filename.indexOf('.') === 0 ||
            filename.indexOf('.zip') > -1 ||
            filename.indexOf(ignore) > -1;
}

function remove(path) {
    var stat = fs.statSync(path);
    if (stat.isFile()) {
        log.debug('删除文件', dirPath + '/' + file);
        try {
            fs.unlinkSync(path);
        } catch(e) {
            log.warning('删除文件', path, '失败');
        }
    } else if (stat.isDirectory) {
        log.debug('删除目录', path);
        file.walkSync(path, function (dirPath, dirs, files) {
            files.forEach(function(file) {
                remove(dirPath + '/' + file);
            });
            dirs.forEach(function(dir) {
                remove(dirPath + '/' + dir);
            });
        });
        try {
            fs.rmdirSync(path);
        } catch(e) {
            log.warning('删除目录', path, '失败');
        }
    }
}

function backup(subject, target, original) {
    log.info('打包：', target, ' 源：', original);
    pack.pack(target, original);
    log.info('发送备份邮件');
    mail.backup(subject, target, function() {
        log.info('备份邮件发送完成，移除备份文件：', target, original);
        remove(target);
        remove(original);
    }, function(e) {
        log.warning('备份邮件发送失败，错误：', e);
    });
}

exports.live = function () {

};

exports.log = function () {
    log.info('开始备份日志');
    var target;
    file.walkSync(root + 'logs/', function (dirPath, dirs, files) {
        log.info('扫描目录：', dirPath, ' 下的日志');
        files.forEach(function(file) {
            log.debug('日志：', file);
            if (isIgnore(file)) {
                log.debug('日志：', file, ' 为忽略打包的文件');
                return;
            }
            var filename = 'log-' + file.replace('.log', '.zip');
            target = dirPath + filename;
            file = dirPath + file;
            backup(filename, target, file);
        });
    });
};

exports.weather = function () {
    log.info('开始备份天气图片');
    var target;
    file.walkSync(root + 'downloads/', function (dirPath, dirs, files) {
        if (dirs.length === 0 || (dirPath == root + 'downloads/')) {
            return;
        }

        dirs.forEach(function (dir) {
            if (isIgnore(dir)) {
                log.debug('天气图片：', file, ' 为忽略打包的文件');
                return;
            }
            target = dirPath + '-' + dir + '.zip';
            dir = dirPath + '/' + dir;
            var subject = target.substring(target.lastIndexOf('/') + 1);
            log.info('打包天气图片：', target, ' 天气图片目录：', dir);
            backup(subject, target, dir);
        });
    });
};