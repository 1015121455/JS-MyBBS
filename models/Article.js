/**
 * Created by Administrator on 2016/12/31.
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
var ArticleSchema = new Schema({
    _id :{type:String,unique:true,default:shortid.generate},
    author:{type:String,default:''},
    selectName:{type:String,default:''},
    title:{type:String,default:''},
    content:{type:String,dafault:''},
    date:{type:String,default:time.minute},
    time:{type:Date,default:Date.now},
    comments:{type:Array,default:[]},
    users:{type:Object,default:{}},
    pv:{type:Number,default:0}
});
var Article = mongoose.model('Article',ArticleSchema);
module.exports = Article;