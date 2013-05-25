var _ = require('underscore'),
    nodemailer = require('nodemailer'),
    mails = require('./config').mail,
    log = require('./log'),
    transports = [];

function init() {
    mails.forEach(function(m) {
        transports.push(nodemailer.createTransport('SMTP', m));
    });
    log.info('初始化mail，共有', transports.length, '个邮箱。');
}

exports.send = function (to, subject, text, attachments, callback, error) {
    log.info('发送邮件：', to, subject, text, attachments);

    if (!to || !subject || !text) {
        log.warning('邮件必要字段为空，无法发送邮件：', to, subject, text);
        return;
    }

    if (_.isFunction(attachments)) {
        error = callback;
        callback = attachments;
    }

    var option = {
            to: to,
            subject: subject,
            text: text,
            attachments: attachments
        };

    transports.forEach(function (t) {
        option.from = t.options.auth.user;
        log.info(option.from, '开始发送邮件到', to);
        t.sendMail(option, function (e, status) {
            if (e) {
                log.warning('邮件发送失败，错误信息：', e);
                if (error) {
                    error(e);
                }
            } else {
                log.info('邮件发送成功，服务器返回状态：', status.message, status.messageId);
                if (callback) {
                    callback();
                }
            }
        });
    });
};

init();