/**
 * Created by Administrator on 2016/12/27.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var shortid = require('shortid');
//保存当前时间的各种格式
var date = new Date();
var time = {
    date:date,
    year:date.getFullYear(),
    month:date.getFullYear() + '-' + (date.getMonth()+1),
    day:date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate(),
    minute:date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes()<10 ? '0' + date.getMinutes() : date.getMinutes()),

}
var UserSchema = new Schema({
    _id:{
        type:String,
        //唯一的
        unique:true,
        default:shortid.generate
    },
    name:{type:String,default:''},
    userName:{type:String,default:''},
    password:{type:String,default:''},
    email:{type:String,default:''},
    qq:{type:Number,default:null},
    motto:{type:String,default:'这个人很懒，什么个性签名都没有留下...'},
    company:{type:String,default:''},
    website:{type:String,default:''},
    date:{type:String,default:time.minute},
    logo:{type:String,default:'/upload/images/defaultlogo.jpg'},
    jifen:{type:Number,default:0},
    articleNum:{type:Number,default:0},
    commentsNum:{type:Number,default:0},
    city:{type:String,default:''}
});
var User = mongoose.model('User',UserSchema);
module.exports = User;