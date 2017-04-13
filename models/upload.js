/**
 * Created by Administrator on 2017/1/4.
 */

var multer = require('multer');

var storage = multer.diskStorage({
    destination:function (req,file,cb) {
        cb(null,'public/upload/newImages');
    },
    filename:function (req,file,cb) {
        //图片重命名
        req.file = file;
        var name = req.session.user.userName;
        if(file.mimetype == 'image/jpeg'){
            req.extension = name +'.jpg'
        }else if(file.mimetype == 'image/png'){
            req.extension = name +'.png'
        }else if(file.mimetype == 'image/gif'){
            req.extension = name +'.gif'
        }
        cb(null,req.extension)
    }
})
var upload = multer({
    storage:storage
})
module.exports = upload;