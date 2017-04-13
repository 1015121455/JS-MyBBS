//首页的路由
var express = require('express');
var router = express.Router();
var url = require('url');
var User = require('../models/User')
var Article = require('../models/Article')
//引入数据库操作对象
var DBSet = require('../models/db');


function isLogined(req) {
    return req.session.logined;
}
//首页路由
router.get('/',function (req,res,next) {
    //console.log(req.session);
    if (isLogined(req)) {
        res.render('web/index',{
            logined:isLogined(req),
            userInfo:req.session.user,
            userInfoId:req.session.user._id
        });
    } else {
        res.render('web/index',{
            logined:isLogined(req),
            userInfo:req.session.user,
            userInfoId:null
        });
    }
})
//首页的三个列表
router.get('/tab',function (req, res, next) {
    var params = url.parse(req.url,true);
    var currentTab = params.query.tab;
    var page = params.query.p;
    if(currentTab == 'all'){
        Article.find({}).skip((page - 1)*20).limit(20).sort({time:-1}).exec(function (err,post) {
            Article.find({}).exec(function (err,allp) {

                post.push(allp.length);
                //post.tab = currentTab;
                return res.json(post);
            })
        })
    } else {
        Article.find({selectName:currentTab}).skip((page - 1)*20).limit(20).sort({time:-1}).exec(function (err,post) {
            Article.find({selectName:currentTab}).exec(function (err,allp) {
                post.push(allp.length);
                //post.tab = currentTab;
                return res.json(post);
            })

        })
    }
})
//获取首页的 top10 用户
router.get('/top10',function (req,res,next) {
    User.find({}).limit(10).sort({jifen:-1}).exec(function (err,user) {
        if ( err ) {
            res.end('error');
        } else {
            if( user ) {
                return res.json(user);
            } else {
                res.end('error');
            }
        }
    });
})
//获取积分榜的 top100 用户
router.get('/getTop100',function (req,res,next) {
    User.find({}).limit(100).sort({jifen:-1}).exec(function (err,user) {
        if ( err ) {
            res.end('error');
        } else {
            if( user ) {
                return res.json(user);
            } else {
                res.end('error');
            }
        }
    });
})
//跳转到top 100 用户页面
router.get('/top100',function (req,res,next) {
    User.find({}).limit( 100 ).sort({jifen:-1}).exec(function (err,user) {
        if (isLogined(req)) {
            if ( err ) {
                res.redirect('/');
            } else {
                if( user ) {
                    res.render('web/top100',{
                        logined:isLogined(req),
                        title:'Top100',
                        logined:req.session.logined,
                        userInfo:req.session.user,
                        userInfoId:req.session.user._id
                    });
                } else {
                    res.redirect('/');
                }
            }
        } else {
            if ( err ) {
                res.redirect('/');
            } else {
                if( user ) {
                    res.render('web/top100',{
                        logined:isLogined(req),
                        title:'Top100',
                        logined:req.session.logined,
                        userInfo:req.session.user,
                        userInfoId:null
                    });
                } else {
                    res.redirect('/');
                }
            }
        }
    });
});
//搜索结果页面的路由
router.get('/search', function (req, res) {
    var pattern = new RegExp(req.query.keyWord, "i");
    Article.find({title:pattern}).exec(function (err, post) {
        if (isLogined(req)) {
            if (err) {
                return res.redirect('/');
            }
            console.log(post);
            if( post[0] ){
                post.forEach(function (art) {
                    if(art.selectName === 'share'){
                        art.selectName = '分享'
                    } else if(art.selectName === 'ask'){
                        art.selectName = '问答'
                    }
                })
                res.render('web/search', {
                    title: "SEARCH:" + req.query.keyWord,
                    posts: post,
                    logined:isLogined(req),
                    userInfo:req.session.user,
                    userInfoId:req.session.user._id,
                    noResult:null
                });
            } else {
                res.render('web/search', {
                    title: "SEARCH:" + req.query.keyWord,
                    posts: post,
                    logined:isLogined(req),
                    userInfo:req.session.user,
                    userInfoId:req.session.user._id,
                    noResult:'对不起，没有您搜索的话题标题...'
                });
            }
        } else {
            if (err) {
                return res.redirect('/');
            }
            if( post ){
                post.forEach(function (art) {
                    if(art.selectName === 'share'){
                        art.selectName = '分享'
                    } else if(art.selectName === 'ask'){
                        art.selectName = '问答'
                    }
                })
                res.render('web/search', {
                    title: "SEARCH:" + req.query.keyWord,
                    posts: post,
                    logined:isLogined(req),
                    userInfo:req.session.user,
                    userInfoId:null,
                    noResult:null
                });
            } else {

                res.render('web/search', {
                    title: "SEARCH:" + req.query.keyWord,
                    posts: post,
                    logined:isLogined(req),
                    userInfo:req.session.user,
                    userInfoId:null,
                    noResult:'对不起，没有您搜索的话题标题...'
                });
            }
        }
    });
    
});
module.exports = router;
