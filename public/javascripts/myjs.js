/**
 * Created by Administrator on 2017/1/6.
 */
$(function () {
   $('#searchInput input').mouseenter(function () {
       $(this).css('background-color','#ffffff');
   }).mouseleave(function () {
        $(this).css('background-color','#888888');
    }).focusout(function () {
       $(this).css('background-color','#888888').stop().animate({width:200},300);
   }).focus(function () {
       $(this).css('background-color','#ffffff').stop().animate({width:300},300);
       $(this).mouseleave(function () {
           $(this).css('background-color','#ffffff');
       })
   });
});