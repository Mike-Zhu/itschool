/**
 * 
 * 客户服务
 * customerService
 * 
 */
const sendMail = require('../service/mail')
const { checkHeader } = require('../service/check');
const send = require('koa-send'); // "koa-send"
const moment = require('moment')

class CustomerService {
    static async feedback(ctx, next) {
        const { title, content, user_id } = ctx.request.body;
        // console.log(title,content)

        const isValid = Check.checkHeader(ctx.request, user_id)
        if (!isValid) {
            ctx.response.body = {
                type: 'false',
                data: '登录错误，请重新登录'
            }
            return;
        };

        if (!title || !content) {
            ctx.response.body = {
                type: false,
                data: "请填写邮箱地址和内容"
            }
            return;
        }
        const reg = new RegExp("^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$");
        if (!reg.test(title)) {
            ctx.response.body = {
                type: false,
                data: "请填写正确的邮箱地址"
            }
            return;
        }
        const result = await sendMail('kefu@shuatiapp.cn', `来自用户 ${title} 的反馈信息`, content)
        //给对方一个反馈
        sendMail(title, `感谢您的反馈！`, "客服会在短时间内对此问题做出调整，希望能给您带来更好的产品体验！")
        ctx.response.body = result
    }

    static async getUpdate(ctx, next) {
        // const { version } = ctx.query
        const res = {
            version: "1.21",
            size: "1.61M",
            date: moment().format('YYYY/MM/DD'),
            updateInfo: ['UI改动', '修复BUG若干'],
            url: "https://shuatiapp.cn/api/getNewVersion"
        }
        ctx.response.body = {
            type: true,
            data: res
        }
    }

    static async getNewVersion(ctx, next) {
        var fileName = 'app-release.apk';
        ctx.attachment(fileName);
        await send(ctx, fileName, { root: __dirname + './../../version' });
    }
}
module.exports = CustomerService