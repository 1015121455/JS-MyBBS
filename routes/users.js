/**
 * Created by hama on 2016/12/8.
 */
//登录注册的路由

var express = require('express');
var router = express.Router();
//引入markdown模块
var markdown = require('markdown').markdown;
/*var hyperdown = require('hyperdown');
var hyper = new hyperdown;*/

//加载依赖
var url = require('url');
//上传头像所需要的模块
var multer = require('multer');
var upload = require('../models/upload');
//验证
var validator = require('validator');
//用户数据库操作类
var User = require('../models/User');
//文章数据库操作类
var Article = require('../models/Article');
//var Notify = require('../models/Notify');
var DBSet = require('../models/db');
//var siteFunc = require('../models/db/siteFunc');
//加密类
var crypto = require('crypto');
//时间格式化
var moment = require('moment');
//站点的配置
var settings = require('../models/db/settings');
var shortid = require('shortid');
//系统相关操作
//var system = require("../util/system");
var fs = require('fs');
var gm = require('gm');
//数据校验
var filter = require('../util/filter');


var returnUserRouter = function(io){
    //判断是否登录
    function isLogin(req) {
        return req.session.logined;
    }
    //用户注册的页面
    router.get('/reg',function (req,res,next) {
        res.render('web/reg',{
            title:'用户注册',
            logined:req.session.logined,
            userInfo:req.session.user
        });
    })
    //用户注册的行为
    router.post('/doReg',function (req,res,next) {
        var errors;
        var userName = req.body.userName;
        var email = req.body.email;
        var password = req.body.password;
        var confirmPsd = req.body.confirmPassword;
        //在服务器端再次验证数据格式
        if(!validator.matches(userName,/^[a-zA-Z][a-zA-Z0-9_]{5,11}$/)){
            errors = "用户名为6-12位，以字母开头，只能包含字母数字下划线";
        }
        if(!validator.matches(password,/^[?!a-zA-Z0-9_]{6,16}$/)){
            errors = "6-16位，只能包含字母数字下划线";
        }
        if(password != confirmPsd){
            errors = "密码不匹配，请重新输入";
        }
        if(!validator.isEmail(email)){
            errors = "请输入正确的邮箱地址";
        }
        if(errors){
            res.end(errors);
        } else {
            var regMsg = {
                email : email,
                username : userName
            };
            //邮箱和用户名必须唯一
            var query = User.find().or([{'email':email},{userName:userName}]);
            query.exec(function (err,user) {
                if(user.length > 0){
                    errors = "邮箱或者用户名已存在！";
                    res.end(errors);
                } else {
                    //密码加密
                    var newPsd = DBSet.encrypt(password,settings.encrypt_key);
                    req.body.password = newPsd;
                    DBSet.addOne(User,req,res);
                    res.end("success");
                }
            })
        }
    })
    
    
    
    //用户的登录页面
    router.get('/login',function (req,res,next) {
        if(isLogin(req)){
            res.redirect('/');
        } else {
            res.render('web/login',{
                title:'登录',
                logined:req.session.logined,
                userInfo:req.session.user
            })
        }

    });
    //用户登录的操作
    router.post('/doLogin',function (req,res,next) {
        var userName = req.body.userName;
        var password = req.body.password;
        var newPsd = DBSet.encrypt(password,settings.encrypt_key);
        var errors;
        //在服务端再次验证表单的格式
        if(!validator.matches(userName,/^[a-zA-Z_][a-zA-Z0-9_]{5,11}$/)){
            errors = '用户名格式不正确';
        }
        if(!validator.matches(password,/^[?!a-zA-Z0-9_]{6,16}$/)){
            errors = '密码6-16个字符'
        }
        if(errors){
            res.end(errors);
        } else {
            User.findOne({userName:userName,password:newPsd},function (err,user) {
                if(user){
                    //将cookie存入缓存
                    filter.gen_session(user,res);
                    //console.log(user);
                    res.end('success');
                } else {
                    res.end('用户名或者密码错误!');
                }
            })
        }
    });
    //用户退出
    router.get('/loginOut',function (req,res) {
        req.session.destroy();
        res.clearCookie(settings.auth_cookie_name);
        res.redirect('/')
    })
    //用户信息设置页面
    router.get('/userSetting',function (req,res,next) {
        if(isLogin(req)){
            res.render('web/setting',{
                title:'设置',
                logined:req.session.logined,
                userInfo:req.session.user
            })

        } else {
            res.redirect('/users/login');
        }

    })
    //通过路由状态的ID获取用户信息
    router.get('/userInfo',function (req,res,next) {
        var params = url.parse(req.url,true);
        var currentId = params.query.uid;
        if(shortid.isValid(currentId)){
            User.findOne({_id:currentId},function (err,result) {
                if(err){
                    console.log(err);
                } else {
                    return res.json(result);
                }
            })
        }
    })
    //用户信息保存操作
    router.post('/doUserSetting',function (req,res,next) {

        var errors;
        var website = req.body.website;
        var city = req.body.city;
        var qq = req.body.qq;
        var comments = req.body.comments;

        //在服务器端再次验证数据格式
        if(website && !validator.matches(website,/^[http://]?([\w-]+\.)+[\w-]+[\w-]$/)){
            errors = "请输入正确的网站地址";
        }
        if(city && !validator.isLength(city,2,16)){
            errors = "请填写正确的城市名称";
        }
        if(qq && !validator.matches(qq,/^[1-9][0-9]{4,11}$/)){
            errors = "请输入正确的QQ号";
        }
        if(errors){
            res.end(errors);
        } else {

            var logMsg = req.body;
            User.findByIdAndUpdate(req.session.user._id,{$set:logMsg},function (err,user) {
                if(user){
                    req.session.user = null;
                    res.end('success');
                    //console.log(req.session);
                } else {
                    res.end('用户名或者密码错误!');
                }
            })
        }
    });
    //用户头像的保存操作
    router.post('/upload',upload.single('photo'),function (req,res) {
        //console.log(req.extension);//头像文件名
        gm('public/upload/newImages/'+req.extension).resize(200,200,'!').write('public/upload/images/'+req.extension,function (err) {
            if(req.file){
                User.findByIdAndUpdate(req.session.user._id,{$set:{logo:'/upload/images/' + req.extension}},function(err,user){
                    //如果发生了错误,跳转回首页
                    if(err){
                        return res.redirect('/users/userSetting');
                    }
                    /*req.session.user = null;
                     res.redirect('/users/userSetting');*/
                    Article.update({'author':req.session.user.userName},{$set:{'users.logo':'/upload/images/' + req.extension}},function (err,result) {
                        if(err){
                            return res.redirect('/users/userSetting');
                        }
                        req.session.user = null;
                        res.redirect('/users/userSetting');
                    });
                });
            }else{
                res.redirect('/users/userSetting');
            }
        })
    })
    //在个人资料里面用户密码的修改
    router.post('/rePsd',function (req,res,next) {
        var password= req.body.password;
        var newPassword = req.body.newPassword;
        var errors;
        //在服务端再次验证表单的格式
        if(!validator.matches(password,/^[?!a-zA-Z0-9_]{6,16}$/)){
            errors = '密码6-16个字符';
        }
        if(!validator.matches(newPassword,/^[?!a-zA-Z0-9_]{6,16}$/)){
            errors = '密码6-16个字符'
        }
        var encryptPsd = DBSet.encrypt(password,settings.encrypt_key);
        var newencyptPsd = DBSet.encrypt(newPassword,settings.encrypt_key);
        if(errors){
            res.end(errors);
        } else {
            if(req.session.user.password != encryptPsd){
                res.end('当前密码不正确')
            } else {
                //当前密码输入正确
                //需要更新的数据
                var logMsg = {password:newencyptPsd};
                User.findByIdAndUpdate(req.session.user._id,{$set:logMsg},function (err,user) {
                    if(user){
                        req.session.user = null;
                        res.end('success');
                    } else {
                        res.end('用户名或者密码错误!');
                    }
                })
            }
        }
    });
    //忘记密码找回密码页面
    router.get('/forgetPsd',function (req,res,next) {
        if(isLogin(req)){
            res.redirect('/users/userSetting');
        } else {
            res.render('web/forgetPsd',{
                title:'找回密码',
                logined:req.session.logined,
                userInfo:req.session.user
            })
        }
    })
    //忘记密码通过邮箱找回密码行为
    router.post('/getPsd',function (req,res,next) {
        var email= req.body.email;
        var userName = req.body.userName;
        var newPassword = req.body.newPassword;
        var errors;
        //在服务端再次验证表单的格式
        if(!validator.isEmail(email)){
            errors = '邮箱格式不正确';
        }
        if(!validator.matches(newPassword,/^[?!a-zA-Z0-9_]{6,16}$/)){
            errors = '密码6-16个字符'
        }
        //对密码进行加密
        var newencyptPsd = DBSet.encrypt(newPassword,settings.encrypt_key);
        if(errors){
            res.end(errors);
        } else {
            User.findOne({email:email},function (err,result) {
                if( result ){
                    if(result.userName == userName) {
                        //当前密码输入正确
                        //需要更新的数据
                        var logMsg = {password:newencyptPsd};
                        User.findByIdAndUpdate({_id:result._id},{$set:logMsg},function (err,user) {
                            if(user){
                                res.end('success');
                            } else {
                                res.end('密码修改失败');
                            }
                        })
                    } else {
                        res.end('用户名和注册邮箱不符！')
                    }
                } else {
                    res.end('注册邮箱错误！');
                }
            });
        }
    })
    /*==================开始发表模块===============*/


    //发表页面
    router.get('/creatArticle',function (req,res,next) {
        if(isLogin(req)){
            res.render('web/creatArticle',{
                title:'发表',
                logined:req.session.logined,
                userInfo:req.session.user
            })
        } else {
            res.redirect('/users/login');
        }
        

    })
    //发表行为
    router.post('/creatArticle',function (req,res) {
        var errors;
        var selectName = req.body.selectName;
        var title = req.body.title;
        var content = req.body.content;
        //再次在后台验证表单数据的正确
        if(!validator.isLength(title,10,30)){
            errors = '标题字数必须在10-30之间'
        }
        if(errors){
            res.end(errors);
        } else {
            req.body.users = req.session.user;
            console.log(req.body);
            var newObj = new Article(req.body);
            newObj.save(function(err){
                if(err){
                    res.end('error');
                }else{
                    User.update({userName:req.session.user.userName},{$set:{jifen:req.session.user.jifen + 10,articleNum:req.session.user.articleNum + 1}},function (err,result) {
                        if(result){
                            req.session.user = null;
                            res.end('success');
                        } else {
                            return res.end('error');
                        }
                    })
                }
            })
        
            /*Article.create(req.body,function (article) {
                console.log(article);
            })
            res.end('success');*/
        }
    });
    /*=============文章详情模块============*/
    //文章详情页面，
    router.get('/articleContent',function (req,res,next) {
        var params = url.parse(req.url,true);
        var currentId = params.query._id;
        var errors;
        var contents;
        if (isLogin(req)) {
            res.render('web/article',{
                title:'文章详情',
                logined:req.session.logined,
                userInfo:req.session.user,
                auth:req.session.user.auth,
                userName:req.session.user.userName,
                articleId:currentId,
                contents:contents
            })
        } else {
            res.render('web/article',{
                title:'文章详情',
                logined:req.session.logined,
                userInfo:req.session.user,
                userName:null,
                articleId:currentId,
                contents:contents
            })
        }

    })
    //通过路由状态的ID获取文章信息
    router.get('/articleInfo',function (req,res,next) {
        var params = url.parse(req.url,true);
        var currentId = params.query._id;
        if(shortid.isValid(currentId)){
            Article.findOne({_id:currentId},function (err,result) {
                if(err || !result){
                    return res.end('error');
                } else {
                    Article.findByIdAndUpdate(currentId,{$set:{pv:result.pv + 1}},function (err,upResult) {

                        if(result){
                            result.content = markdown.toHTML(result.content);
                            result.comments.forEach(function (comment) {
                                comment.content = markdown.toHTML(comment.content);
                            })
                            return res.json(result);
                        } else {
                            return res.end('error');
                        }
                    })
                }
            })
        } else {
            return res.end('error');
        }
    });
    //通过路由状态获取用户的user信息
    router.get('/authorInfo',function (req,res,next) {
        var params = url.parse(req.url,true);
        var currentId = params.query._id;
        //通过文章的id找到用户的id
        if(shortid.isValid(currentId)){
            Article.findOne({_id:currentId},function (err,result) {
                if(err || !result){
                    return res.end('error');
                }else{
                    User.findOne({_id:result.users._id},function (err,data) {
                        if(err){
                            return res.end('error');
                        } else {
                            if(data){
                                return res.json(data);
                            } else {
                                return res.end('error');
                            }
                        }
                    });
                }
            })
        }
    });
    //回复操作
    router.post('/addComments',function (req,res) {
        var comments= req.body.comments;
        var errors;
        //在服务端再次验证表单的格式
        if(!validator.isLength(comments,10,2000)){
            errors = '回复字符长度必须在10-2000之间'
        }
        if(errors){
            res.end(errors);
        } else {
            Article.findOne({_id:req.body._id},function (err,result) {
                if(err){
                    return res.end('error');
                } else {
                    //更新留言信息
                    var date = new Date();
                    //保存当前时间的各种格式
                    var time = {
                        date:date,
                        year:date.getFullYear(),
                        month:date.getFullYear() + '-' + (date.getMonth()+1),
                        day:date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate(),
                        minute:date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes()<10 ? '0' + date.getMinutes() : date.getMinutes()),

                    }
                    var logMsg = {
                        content:comments,
                        no:result.comments.length+1,
                        users:req.session.user,
                        date:time.minute,
                        zanNum:0,
                        zanUser:[0]
                    };
                    Article.findByIdAndUpdate(req.body._id,{$push:{comments:logMsg}},function (err,result) {
                        if(result){
                            User.update({userName:req.session.user.userName},{$set:{jifen:req.session.user.jifen + 5,commentsNum:req.session.user.commentsNum + 1}},function (err,result) {
                                if(result){
                                    req.session.user = null;
                                    res.end('success');
                                } else {
                                    return res.end('error');
                                }
                            })
                        } else {
                            res.end('留言失败');
                        }
                    })
                }
            })

        }
    });
    //点赞操作
    router.get('/zan',function (req,res) {
        var params = url.parse(req.url,true);
        var articleId = params.query._id;
        var zanUser = params.query.zanUser;
        var No = params.query.no;
        var isZan = params.query.isZan;
        if ( isZan == '0' ) {
            Article.findOne({_id:articleId},function (err,data) {
                data.comments[No].zanNum++;
                data.comments[No].zanUser.push(zanUser);
                Article.findByIdAndUpdate(articleId,{$set:data},function (err,result) {
                    if ( result ) {
                        Article.findOne({_id:articleId},function (err,resu) {
                            if(resu){
                                resu.content = markdown.toHTML(resu.content);
                                resu.comments.forEach(function (comment) {
                                    comment.content = markdown.toHTML(comment.content);
                                })
                                return res.json(resu);
                            } else {
                                return res.end('error');
                            }
                        })
                    } else {
                        res.end('error');
                    }
                })
            })

        } else {
            Article.findOne({_id:articleId},function (err,data) {
                Array.prototype.indexOf = function(val) {
                    for (var i = 0; i < this.length; i++) {
                        if (this[i] == val) return i;
                    }
                    return -1;
                };
                Array.prototype.remove = function(val) {
                    var index = this.indexOf(val);
                    if (index > -1) {
                        this.splice(index, 1);
                    }
                };
                data.comments[No].zanNum--;
                data.comments[No].zanUser.remove(zanUser);
                Article.findByIdAndUpdate(articleId,{$set:data},function (err,result) {
                    if ( result ) {
                        Article.findOne({_id:articleId},function (err,resu) {
                            if(resu){
                                resu.content = markdown.toHTML(resu.content);
                                resu.comments.forEach(function (comment) {
                                    comment.content = markdown.toHTML(comment.content);
                                })
                                return res.json(resu);
                            } else {
                                return res.end('error');
                            }
                        })
                    } else {
                        res.end('error');
                    }
                })
            })
        }
    })
    /*==============点击其他会员的用户名或者头像跳转到对应的会员信息==============*/
    //其他用户信息页面
    router.get('/otherUser',function (req,res,next) {
        var params = url.parse(req.url,true);
        var currentAuthor = params.query.author;
        //console.log(currentAuthor);
        res.render('web/otherUser',{
            title:'用户信息详情',
            logined:req.session.logined,
            userInfo:req.session.user,
            otherUserAuthor:currentAuthor
        })
    });
    //通过路由状态获取用户的user信息
    router.get('/otherUserInfo',function (req,res,next) {
        var params = url.parse(req.url,true);
        var currentAuthor = params.query.author;
        User.findOne({userName:currentAuthor},function (err,result) {
            if(err){
                return res.end('error');
            } else {
                if(result){
                    return res.json(result);
                } else {
                    return res.end('error');
                }
            }
        });
    });
    //通过路由状态的Author获取用户的文章信息
    router.get('/otherArticleInfo',function (req,res,next) {
        var params = url.parse(req.url,true);
        var currentAuthor = params.query.author;
        Article.find({author:currentAuthor}).limit(5).sort({time:-1}).exec(function (err,result) {
            if(err){
                return res.end('error');
            } else {
                if(result){
                    return res.json(result);
                } else {
                    return res.end('error');
                }
            }
        });
    });
    //通过路由状态的Author获取用户评论信息
    router.get('/otherJoinInfo',function (req,res,next) {
        var params = url.parse(req.url,true);
        var currentAuthor = params.query.author;
        Article.find({'comments.users.userName':currentAuthor}).limit(5).sort({time:-1}).exec(function (err,result) {
            if(err){
                return res.end('error');
            } else {
                if(result){
                    return res.json(result);
                } else {
                    return res.end('error');
                }
            }
        })
    });
    /*==============================文章话题修改和删除模块===========================*/
    router.get('/updateArticle',function (req,res,next) {
        var params = url.parse(req.url,true);
        var currentId = params.query._id;
        if(isLogin(req)){
            res.render('web/updateArticle',{
                title:'修改话题',
                logined:req.session.logined,
                userInfo:req.session.user,
                userInfoId:req.session.user._id,
                articleId:currentId
            })
        } else {
            res.redirect('/users/login');
        }
    });
    //通过路由状态的文章ID获取用户的文章信息
    router.get('/updateArticleInfo',function (req,res,next) {
        var params = url.parse(req.url,true);
        var currentId = params.query._id;
        Article.findOne({_id:currentId},function (err,result) {
            if(err){
                return res.end('error');
            } else {
                if(result){
                    return res.json(result);
                } else {
                    return res.end('error');
                }
            }
        });

    });
    //修改话题的行为
    router.post('/updateArticle',function (req,res) {
        var errors;
        var selectName = req.body.selectName;
        var title = req.body.title;
        var content = req.body.content;
        //再次在后台验证表单数据的正确
        if(!validator.isLength(title,10,30)){
            errors = '标题字数必须在10-30之间'
        }
        if(errors){
            res.end(errors);
        } else {
            Article.findByIdAndUpdate(req.body._id,req.body,function (err,result) {
                if ( err ) {
                   res.end('更新话题时出现错误')
                } else {
                    if(result){
                        User.update({userName:req.session.user.userName},{$set:{jifen:req.session.user.jifen + 5}},function (err,result) {
                            //req.session.user = null;
                            res.end('success');
                        })
                    } else {
                        res.end('更新话题失败');
                    }
                }
            })
        }
    });
    //删除话题的操作
    router.get('/deleteArticle',function (req,res,next) {
        var params = url.parse(req.url,true);
        var currentId = params.query._id;
        Article.remove({_id:currentId},function (err,result) {
            if (err) {
                res.end('删除话题时出现错误');
            } else {
                if(result){
                    res.end('success');
                } else {
                    res.end('删除话题失败');
                }
            }
        })
    });
    return router;
}
module.exports = returnUserRouter;

