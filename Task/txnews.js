
/*
更新时间: 2021-03-22 21:30

腾讯新闻签到修改版，可以自动阅读文章获取红包，该活动为瓜分百万现金挑战赛，针对幸运用户参与，本脚本已不能自动打开红包，需每天要打开腾讯新闻app一次，请须知

*/
const $ = new Env('腾讯新闻');
const notify = $.isNode() ? require('./sendNotify') : '';
let notifyInterval =$.getdata('notifynum')||50; //阅读篇数间隔通知开为1，常关为0;

let SignArr = [],SignUrl = "";
    cookiesArr = [],CookieTxnews = "";
    VideoArr = [],SignUrl = "",order = "",
    detail = ``, subTitle = ``;
    prizeArr = [],prizeUrl= "";
let read_finish = "",video_finish="";
if ($.isNode()) {
    if (process.env.TXNEWS_COOKIE && process.env.TXNEWS_COOKIE.indexOf('&') > -1) {
        CookieTxnews = process.env.TXNEWS_COOKIE.split('&');
    } else {
        CookieTxnews = process.env.TXNEWS_COOKIE.split()
    };
    if (process.env.TXNEWS_SIGN && process.env.TXNEWS_SIGN.indexOf('#') > -1) {
        SignUrl = process.env.TXNEWS_SIGN.split('#');
    } else {
        SignUrl = process.env.TXNEWS_SIGN.split()
    };
    if (process.env.TXNEWS_VIDEO && process.env.TXNEWS_VIDEO.indexOf('#') > -1) {
        VideoUrl = process.env.TXNEWS_VIDEO.split('#');
    } else {
        VideoUrl = process.env.TXNEWS_VIDEO.split()
    };
    Object.keys(CookieTxnews).forEach((item) => {
        if (CookieTxnews[item]) {
            cookiesArr.push(CookieTxnews[item])
        }
    })
    Object.keys(SignUrl).forEach((item) => {
        if (SignUrl[item]) {
            SignArr.push(SignUrl[item])
        }
    })
    Object.keys(VideoUrl).forEach((item) => {
        if (VideoUrl[item]) {
            VideoArr.push(VideoUrl[item])
        }
    })
} else {
    cookiesArr.push($.getdata('sy_cookie_txnews'));
    SignArr.push($.getdata('sy_signurl_txnews'));
    VideoArr.push($.getdata('video_txnews'));
    prizeArr.push($.getdata('prize_txnews'))
}

let isGetCookie = typeof $request !== 'undefined'
if (isGetCookie) {
    GetCookie();
    $.done()
}!(async() => {
    if (!cookiesArr[0]) {
        $.msg($.name, '【提示】🉐登录腾讯新闻app获取cookie', "qqnews://article_9500?tab=news_news&from=self", {
            "open-url": "qqnews://article_9500?tab=news_news&from=self"
        });
        return
    }
    if ($.isNode()) {
        timeZone = new Date().getTimezoneOffset() / 60;
        timestamp = Date.now() + (8 + timeZone) * 60 * 60 * 1000;
        bjTime = new Date(timestamp).toLocaleString('zh', {
            hour12: false,
            timeZoneName: 'long'
        });
        console.log(`\n === 脚本执行 ${bjTime} ===\n`);
    }
    for (let i = 0; i < cookiesArr.length; i++) {
        if (cookiesArr[i]) {
            cookieVal = cookiesArr[i];
            signurlVal = SignArr[i];
            videoVal = VideoArr[i];
            prizeVal = prizeArr[i] 
            $.index = i + 1;
            console.log(`-------------------------\n\n开始【腾讯新闻账号${$.index}】`)
            ID = signurlVal.match(/devid=([a-zA-Z0-9_-]+)/)[1]
            token = signurlVal.split("mac")[1]
            await getsign();
            prizeVal?await open():"";
            prizeVal?await treesign():"";
            await activity();
            await getTotal();
            await $.wait(1000);
            await StepsTotal();
            await showmsg();
            if ($.isNode() && process.env.TXNEWS_NOTIFY_CONTROL) {
                if (readnum % notifyInterval == 0 && cashtotal > 2) {
                    await notify.sendNotify($.name, subTile + '\n' + detail)
                }
            }
        }
    }
})()
.catch((e) => $.logErr(e))
    .finally(() => $.done())


function GetCookie() {
    if ($request && $request.url.indexOf("api.prize.qq.com") > -1) {
        const prizeVal = $request.url
        $.log(`prizeVal:${prizeVal}`)
        if (prizeVal) $.setdata(prizeVal, 'prize_txnews')
        $.msg($.name, `获取天天领红包地址: 成功🎉`, ``)
    } else if ($request && $request.body.indexOf("article_read") > -1) {
        const signurlVal = $request.url
        const cookieVal = $request.headers['Cookie'];
        $.log(`signurlVal:${signurlVal}`)
        $.log(`cookieVal:${cookieVal}`)
        if (signurlVal) $.setdata(signurlVal, 'sy_signurl_txnews')
        if (cookieVal) $.setdata(cookieVal, 'sy_cookie_txnews')
        $.msg($.name, `获取Cookie: 成功🎉`, ``)
    }
    else if ($request && $request.body.indexOf("video_read") > -1) {
        const videoVal = $request.url
        $.log(`videoVal:${videoVal}`)
        if (videoVal) $.setdata(videoVal, 'video_txnews')
        $.msg($.name, `获取视频地址: 成功🎉`, ``)
    }
}

function Host(api, body, taskurl) {
    return {
        url: 'https://api.inews.qq.com/activity/v1/' + api + '&isJailbreak=0&devid=' + ID,
        headers: {
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'zh-Hans-CN;q=1, en-CN;q=0.9, zh-Hant-CN;q=0.8',
            'Connection': 'keep-alive',
            'Cookie': cookieVal,
            'Host': 'api.inews.qq.com',
            'Referer': taskurl,
            'store': '1',
            'devid': ID,
            'User-Agent': 'QQNews/6.4.40 (iPhone; iOS 14.2; Scale/3.00)'
        },
        body: body
    }
}

//签到
function getsign() {
    return new Promise((resolve, reject) => {
        const signUrl = {
            url: `https://api.inews.qq.com/task/v1/user/signin/add?`,
            headers: Host().headers
        };
        $.post(signUrl, (error, resp, data) => {
            let obj = JSON.parse(data)
                // $.log(JSON.stringify(obj,null,2))
            if (obj.info == "success") {
                next = obj.data.next_points
                tip = obj.data.tip_soup || obj.data.share_tip
                imgurl = obj.data.share_img
                Dictum = tip.replace(/<br>/g, "") + " " + obj.data.author
                signinfo = '【签到信息】连续签到' + obj.data.signin_days + '天 ' + '明日+' + next + '金币 成功🎉\n'
            } else {
                $.msg($.name, '签到失败，🉐登录腾讯新闻app获取cookie', "")
                console.log('签到失败，🉐登录腾讯新闻app获取cookie' + data)
                return
            }
            resolve()
        })
    })
}

function open() {
 return new Promise((resolve, reject) => {
 let url = {
     url: prizeVal,
     headers: Host().headers,
     body: "actname=chajian_shouqi"
 };
     url.headers['Referer'] = 'http://inews.qq.com/inews/iphone/';
     url.headers['Host'] = 'api.prize.qq.com';
 $.post(url, async(error, resp, data) => {
     if(resp.statusCode ==200){
       obj = JSON.parse(data);
       if(obj.code==0){
         amount = obj.data.type=="rp" ? "天天领红包获得"+obj.data.amount/100+"元": "天天领红包获得"+obj.data.amount+"个金币"
         $.log(amount);
         $.msg($.name, amount,"");
         await zhuli()
       }
     } else if(resp.statusCode !== 403){
       $.log(JSON.stringify(resp,null,2))
     }
     resolve()
    })
  })
}

function zhuli() {
 return new Promise((resolve, reject) => {
    treetoken = prizeVal.split("?")[1]
 let url = {
     url: 'https://api.prize.qq.com/v1/newsapp/rpinvite/zhuli?actname=hongbaozhongxinyaoqing&activefrom=invitetask&'+treetoken,
     headers: Host().headers,
     body: "inviter_openid=17A2385EE6D27888DB9F9D6B0BE90EEA&source=main"
 };
     url.headers['Referer'] = 'http://inews.qq.com/inews/iphone/';
     url.headers['Host'] = 'api.prize.qq.com';
 $.post(url, (error, resp, data) => {
     if(resp.statusCode ==200){
       obj=JSON.parse(data);
       if(obj.code==0){
         //$.log(obj.message)
       }
      }
      resolve()
     })
   })
}
function treesign() {
 return new Promise((resolve, reject) => {
  treetoken = prizeVal.split("?")[1]
 let url = {
     url: 'https://api.prize.qq.com/v1/newsapp/tree/sign?'+treetoken,
     headers: Host().headers,
     body: "current_day="+Math.round(new Date(new Date().toLocaleDateString()).getTime()/1000).toString()
 }
 $.post(url, (error, resp, data) => {
     if(resp.statusCode ==200){
       obj = JSON.parse(data);
       if(obj.code==0){
         amount = obj.data.prize_type=="10" ? "摇钱树签到"+obj.data.prize_num+"经验": "摇钱树签到获得收益"+obj.data.prize_num
         $.log(data)
         $.msg($.name, amount,"")
       }
     } else if(resp.statusCode !== 403){
       $.log(JSON.stringify(resp,null,2))
     }
     resolve()
    })
  })
}



function activity() {
    return new Promise((resolve, reject) => {
        $.get(Host('user/task/list?'), async(error, resp, data) => {
            try {
                let taskres = JSON.parse(data);
                //$.log(JSON.stringify(taskres,null,2))
                if (taskres.ret == 0) {
                    actid = taskres.data.award_notice.activity_id;
                    if (!actid) {
                        actid = $.getdata('txnews_id')
                    } else {
                    $.log(`\n您的活动ID为: ` + actid + "\n\n********* 开始阅读任务 ********\n");
                $.setdata(actid,"txnews_id")
                    }
                    $.desc = ""
                    for (tasks of taskres.data.list) {
                        taskname = tasks.task_title,
                        tasktype = tasks.task_type,
                        taskstatus = tasks.task_status,
                        ratepack = tasks.rate,
                        totalpack = tasks.quota,
                        eventnum = tasks.task_desc,
                        taskurl = tasks.task_url;
                        $.log("去" + taskname + "\n");
                        if (taskstatus == 3) {
                            $.desc += "【" + taskname + "】✅ 已完成\n";
                            $.log(taskname + "已完成")
                        } else {
                            if (tasktype == "article") {
                                readnum = eventnum.match(/>(\d+)</)[1]
                                    //$.desc = "【" + taskname + "】 已领" + ratepack + "个红包 已阅"+readnum+"篇资讯\n";
                                await $.wait(3000);
                                await toRead(signurlVal, 'event=article_read')
                            } else if (tasktype == "video") {
                                videonum = eventnum.match(/>(.+)<\/span>分钟/)[1]
                                    //$.desc += "【" + taskname + "】 已领" + ratepack + "个红包 已看"+videonum+"分钟\n";
                                await $.wait(5000);
                                await toRead(videoVal, 'event=video_read')
                            } else if (tasktype == "cooperation") {
                                await openapp(tasks.task_id)
                            }
                        }
                    }
                }
            } catch (error) {
                $.msg($.name, "获取活动ID失败，详情请看日志", "", "");
                console.log("活动ID日志:" + data);
                return
            }
            resolve()
        })
    })
}

//阅读阶梯
function toRead(urlVal, body) {
    return new Promise((resolve, reject) => {
        $.post({
            url: urlVal,
            headers: Host().headers,
            body: body
        }, (error, resp, data) => {
            try {
                let obj = JSON.parse(data)
                    //$.log(JSON.stringify(obj,null,2))
                if (obj.ret == 0) {
                    console.log("本次阅读成功，获取收益" + obj.data.countdown_timer.countdown_tips + "\n");
                } else if (body.indexOf("article") > -1) {
                    console.log("本次阅读文章失败，" + obj.info + "\n");
                } else if (body.indexOf("video") > -1) {
                    console.log("本次观看视频失败，" + obj.info + "\n");
                }
            } catch (error) {
                console.log("本次阅读失败" + data + "\n")
            }
            resolve()
        })
    })
}

function openapp(taskid) {
    return new Promise((resolve, reject) => {
        $.get(Host('activity/do?activity_id=' + taskid + '&' + token), async(error, resp, data) => {
            try {
                let obj = JSON.parse(data)
                $.log(JSON.stringify(obj, null, 2))
                if (obj.ret == 0) {
                    $.log(taskname + "成功")
                } else {
                    $.log(taskname + "失败，" + obj.info + "\n");
                }
            } catch (error) {
                console.log("本次任务失败" + data + "\n")
            }
            resolve()
        })
    })
}


//阅读文章统计
function StepsTotal() {
    return new Promise((resolve, reject) => {
        $.get(Host('activity/info/get?activity_id=' + actid), async(error, resp, data) => {
            totalred = JSON.parse(data);
            //$.log(JSON.stringify(totalred,null,2))
            totalcion = totalred.data.extends.today_total_coin;
            if (totalred.ret == 0) {
                for (awards of totalred.data.award) {
                    taskType = awards.type,
                        red_get = awards.can_get,
                        redtotal = awards.total,
                        red_opened = awards.opened,
                        task_num = awards.event_num,
                        //readtitle = awards.title.split("，")[0].replace(/[\u4e00-\u9fa5]/g,``)
                        title = awards.title.match(/\d+/)
                    over_red = Number(redtotal - red_opened);
                    if (taskType == "article") {
                        read_res = over_red;
                        $.desc += "【阅读资讯】 已领" + awards.opened + "个红包 已看" + readnum + "篇/再读" + title + "篇\n";
                        if (awards.openable !== 0) {
                            $.log("可以打开" + awards.openable + "个阅读红包，去打开红包");
                            await $.wait(1000);
                            await Redpack(taskType)
                        }
                    }
                    if (taskType == "video") {
                        video_res = over_red;
                        $.desc += "【观看视频】 已领" + awards.opened + "个红包 已看" + videonum + "分钟/再读" + title + "分钟\n";
                        if (awards.openable !== 0) {
                            $.log("可以打开" + awards.openable + "个视频红包，去打开红包");
                            await $.wait(1000);
                            await Redpack(taskType)
                        }
                    }
                }
            }
            resolve()
        })
    })
}


//阶梯红包到账
function Redpack(red_body) {
    return new Promise((resolve, reject) => {
        $.post(Host('activity/redpack/get?', `redpack_type=${red_body}&activity_id=${actid}`,'http://inews.qq.com/inews/iphone/'), (error, resp, data) => {
            let rcash = JSON.parse(data);
            try {
                if (rcash.data.award.length == 1) {
                    redpacks = rcash.data.award.num / 100;
                    if (rcash.ret == 0 && redpacks > 0 && red_body == "article") {
                        redpackres = `【阅读红包】到账` + redpacks + `元🌷\n`;
                        $.log("阅读红包到账" + redpacks + "元\n")
                    } else if (rcash.ret == 0 && redpacks > 0 && red_body == "video") {
                        redpackres = `【视频红包】到账` + redpacks + `元🌷\n`;
                        $.log("视频红包到账" + redpacks + "元\n")
                    }
                } else {
                    $.log(rcash.data.award.length + "个红包到账\n")
                }
            } catch (error) {
                console.log("打开红包失败,响应数据: " + data);
                $.msg($.name, "开红包失败，详情请看日志 ❌", error)
            };
            resolve()
        })
    })
}

//收益总计
function getTotal() {
    return new Promise((resolve, reject) => {
        $.post(Host('usercenter/activity/list?'), (error, resp, data) => {
            if (error) {
                $.msg("获取收益信息失败‼️", "", error)
            } else {
                const Total_Earn = JSON.parse(data)
                cashtotal = Total_Earn.data.wealth[1].title
                $.sub = '【收益总计】' + Total_Earn.data.wealth[0].title + '金币  ' + "钱包: " + cashtotal + '元'
                    // $.log("钱包收益共计"+obj.data.wealth[1].title+"元")
            }
            resolve()
        })
    })
}

function showmsg() {
    return new Promise((resolve, reject) => {
        $.desc += '【每日一句】' + Dictum
        if (readnum && readnum % notifyInterval == 0) {
            $.msg($.name, $.sub, $.desc, {
                'open-url': "https://news.qq.com/FERD/cjRedDown.htm",
                'media-url': imgurl
            })
        } else if (read_res == 0 && video_res == 0) {
            $.msg($.name + ` 今日任务已完成✅`, $.sub, $.desc, {
                'open-url': "https://news.qq.com/FERD/cjRedDown.htm",
                'media-url': imgurl
            })
        } else {
            console.log($.sub + '\n' + $.desc)
        }
        resolve()
    })
}

// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e=GET){t=string==typeof t{urlt}t;let s=this.get;returnPOST===e&&(s=this.post),new Promise((e,i)={s.call(this,t,(t,s,r)={ti(t)e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,POST)}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile=box.dat,this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator=n,this.startTime=(new Date).getTime(),Object.assign(this,e),this.log(,`ud83dudd14${this.name}, u5f00u59cb!`)}isNode(){returnundefined!=typeof module&&!!module.exports}isQuanX(){returnundefined!=typeof $task}isSurge(){returnundefined!=typeof $httpClient&&undefined==typeof $loon}isLoon(){returnundefined!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e={this.get({urlt},(t,s,i)=e(i))})}runScript(t,e){return new Promise(s={let i=this.getdata(@chavy_boxjs_userCfgs.httpapi);i=ii.replace(ng,).trim()i;let r=this.getdata(@chavy_boxjs_userCfgs.httpapi_timeout);r=r1r20,r=e&&e.timeoute.timeoutr;const[o,h]=i.split(@),a={url`http${h}v1scriptingevaluate`,body{script_textt,mock_typecron,timeoutr},headers{X-Keyo,Accept}};this.post(a,(t,e,i)=s(i))}).catch(t=this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fsthis.fsrequire(fs),this.path=this.paththis.pathrequire(path);const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=ste;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fsthis.fsrequire(fs),this.path=this.paththis.pathrequire(path);const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);sthis.fs.writeFileSync(t,r)ithis.fs.writeFileSync(e,r)this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace([(d+)]g,.$1).split(.);let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==tt(Array.isArray(e)(e=e.toString().match([^.[]]+g)[]),e.slice(0,-1).reduce((t,s,i)=Object(t[s])===t[s]t[s]t[s]=Math.abs(e[i+1])0==+e[i+1][]{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(^@.test(t)){const[,s,i]=^@(.).(.)$.exec(t),r=sthis.getval(s);if(r)try{const t=JSON.parse(r);e=tthis.lodash_get(t,i,)e}catch(t){e=}}return e}setdata(t,e){let s=!1;if(^@.test(e)){const[,i,r]=^@(.).(.)$.exec(e),o=this.getval(i),h=inull===onullo{}{};try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()this.isLoon()$persistentStore.read(t)this.isQuanX()$prefs.valueForKey(t)this.isNode()(this.data=this.loaddata(),this.data[t])this.data&&this.data[t]null}setval(t,e){return this.isSurge()this.isLoon()$persistentStore.write(t,e)this.isQuanX()$prefs.setValueForKey(t,e)this.isNode()(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0)this.data&&this.data[e]null}initGotEnv(t){this.got=this.gotthis.gotrequire(got),this.cktough=this.cktoughthis.cktoughrequire(tough-cookie),this.ckjar=this.ckjarthis.ckjarnew this.cktough.CookieJar,t&&(t.headers=t.headerst.headers{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()={})){t.headers&&(delete t.headers[Content-Type],delete t.headers[Content-Length]),this.isSurge()this.isLoon()(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers{},Object.assign(t.headers,{X-Surge-Skip-Scripting!1})),$httpClient.get(t,(t,s,i)={!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)}))this.isQuanX()(this.isNeedRewrite&&(t.opts=t.opts{},Object.assign(t.opts,{hints!1})),$task.fetch(t).then(t={const{statusCodes,statusCodei,headersr,bodyo}=t;e(null,{statuss,statusCodei,headersr,bodyo},o)},t=e(t)))this.isNode()&&(this.initGotEnv(t),this.got(t).on(redirect,(t,e)={try{if(t.headers[set-cookie]){const s=t.headers[set-cookie].map(this.cktough.Cookie.parse).toString();this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t={const{statusCodes,statusCodei,headersr,bodyo}=t;e(null,{statuss,statusCodei,headersr,bodyo},o)},t={const{messages,responsei}=t;e(s,i,i&&i.body)}))}post(t,e=(()={})){if(t.body&&t.headers&&!t.headers[Content-Type]&&(t.headers[Content-Type]=applicationx-www-form-urlencoded),t.headers&&delete t.headers[Content-Length],this.isSurge()this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers{},Object.assign(t.headers,{X-Surge-Skip-Scripting!1})),$httpClient.post(t,(t,s,i)={!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method=POST,this.isNeedRewrite&&(t.opts=t.opts{},Object.assign(t.opts,{hints!1})),$task.fetch(t).then(t={const{statusCodes,statusCodei,headersr,bodyo}=t;e(null,{statuss,statusCodei,headersr,bodyo},o)},t=e(t));else if(this.isNode()){this.initGotEnv(t);const{urls,...i}=t;this.got.post(s,i).then(t={const{statusCodes,statusCodei,headersr,bodyo}=t;e(null,{statuss,statusCodei,headersr,bodyo},o)},t={const{messages,responsei}=t;e(s,i,i&&i.body)})}}time(t){let e={M+(new Date).getMonth()+1,d+(new Date).getDate(),H+(new Date).getHours(),m+(new Date).getMinutes(),s+(new Date).getSeconds(),q+Math.floor(((new Date).getMonth()+3)3),S(new Date).getMilliseconds()};(y+).test(t)&&(t=t.replace(RegExp.$1,((new Date).getFullYear()+).substr(4-RegExp.$1.length)));for(let s in e)new RegExp((+s+)).test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.lengthe[s](00+e[s]).substr((+e[s]).length)));return t}msg(e=t,s=,i=,r){const o=t={if(!t)return t;if(string==typeof t)return this.isLoon()tthis.isQuanX(){open-urlt}this.isSurge(){urlt}void 0;if(object==typeof t){if(this.isLoon()){let e=t.openUrlt.urlt[open-url],s=t.mediaUrlt[media-url];return{openUrle,mediaUrls}}if(this.isQuanX()){let e=t[open-url]t.urlt.openUrl,s=t[media-url]t.mediaUrl;return{open-urle,media-urls}}if(this.isSurge()){let e=t.urlt.openUrlt[open-url];return{urle}}}};this.isMute(this.isSurge()this.isLoon()$notification.post(e,s,i,o(r))this.isQuanX()&&$notify(e,s,i,o(r)));let h=[,==============ud83dudce3u7cfbu7edfu901au77e5ud83dudce3==============];h.push(e),s&&h.push(s),i&&h.push(i),console.log(h.join(n)),this.logs=this.logs.concat(h)}log(...t){t.length0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();sthis.log(,`u2757ufe0f${this.name}, u9519u8bef!`,t.stack)this.log(,`u2757ufe0f${this.name}, u9519u8bef!`,t)}wait(t){return new Promise(e=setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)1e3;this.log(,`ud83dudd14${this.name}, u7ed3u675f! ud83dudd5b ${s} u79d2`),this.log(),(this.isSurge()this.isQuanX()this.isLoon())&&$done(t)}}(t,e)}
