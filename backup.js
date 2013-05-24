var file = require('file'),
	fs = require('fs'),
	pack = require('./pack'),
	log = require('./log'),
	root = fs.realpathSync('.') + '/';

function isIgnore(filename) {
    var date = new Date(),
        ignore = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    return filename.indexOf('.') === 0 || filename.indexOf(ignore) > -1;
}

function sendMail() {

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
            target = dirPath + 'log-' + file.replace('.log', '.zip');
            file = dirPath + file;
            pack.pack(target, file);
            log.info('打包日志：', target, ' 源日志：', file);
        });
    });
};

exports.weather = function () {
    log.info('开始备份天气图片');
    var target;
    file.walkSync(root + 'downloads/', function (dirPath, dirs, files) {
        if (dirs.length == 0 || (dirPath == root + 'downloads/')) {
            return;
        }

        dirs.forEach(function (dir) {
            if (isIgnore(dir)) {
                log.debug('天气图片：', file, ' 为忽略打包的文件');
                return;
            }
            target = dirPath + '-' + dir + '.zip';
            dir = dirPath + '/' + dir;
            pack.pack(target, dir);
            log.info('打包天气图片：', target, ' 天气图片目录：', dir);
        });
    });
};