var AdmZip = require('adm-zip'),
    fs = require('fs'),
    file = require("file"),
    log = require('./log');

exports.pack = function(target) {
    var zip = new AdmZip(),
        paths = Array.prototype.slice.apply(arguments, [1]);
    log.debug('准备打包文件：', target);
    paths.forEach(function (path) {
        var stat = fs.statSync(path);
        if (stat.isFile()) {
            log.debug('打包文件：', path);
            zip.addLocalFile(path);
        } else if (stat.isDirectory()) {
            log.debug('--遍历要打包的文件夹：', path);
            file.walkSync(path, function (dirPath, dirs, files) {
                files.forEach(function(file) {
                    file = dirPath + '/' + file;
                    log.debug('打包文件：', file);
                    zip.addLocalFile(file);
                });
            });
        }
    });
    zip.writeZip(target);
    log.info('文件[', target, ']打包完毕。');
};