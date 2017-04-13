var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//新增的功能
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var io = require('socket.io')();
var fs = require('fs');
//引入flash插件
var flash = require('connect-flash');
var moment = require('moment');
var partials = require('express-partials');
//站点的配置
var settings = require('./models/db/settings');
//路由的加载
var routes = require('./routes/index');
var users = require('./routes/users')(io);//用户的登录注册用到了io
//位置很重要，要放在路由的后边
var filter = require('./util/filter');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(partials());


app.use(favicon(path.join(__dirname, 'public', 'js.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser(settings.session_secret));
app.use(express.static(path.join(__dirname, 'public')));
//使用flash插件
app.use(flash());
//设置session
app.use(session({
    secret: settings.session_secret,
    store: new RedisStore({
        port: settings.redis_port,
        host: settings.redis_host,
        pass : settings.redis_psd,
        ttl: 1800 // 过期时间
    }),
    resave: true,
    saveUninitialized: true
}));
app.use(filter.authUser);
//首页路由
app.use('/', routes);
//登录注册的路由
app.use('/users', users);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
//让整个应用启动起来
app.listen(3000,function(){
    console.log('node is OK');
})
module.exports = app;


