let jwt = require('jsonwebtoken');
let db = uniCloud.database({
  throwOnNotFound: false
});

exports.main = async (event, context) => {
  event = event.body ? JSON.parse(event.body) : event;

  let dateTime = formatTime();
  if (event.api === 'loginWithMp') {
    let wxRes = await uniCloud.httpclient.request(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${appSecret}&js_code=${event.code}&grant_type=authorization_code`, {
        dataType: "json"
      });
    let userId = wxRes.data.openid;
    if (!userId) {
      throw Error(wxRes.data.errmsg)
    }
    let user = await db.collection('user').doc(userId).get();
    let token = 'Bearer ' + jwt.sign({
      userId
    }, jwtSecret)
    if (user.data[0]) {
      return {
        user: user.data[0],
        token
      }
    } else {
      let data = {
        _id: userId,
        createdAt: dateTime
      }
      await db.collection('user').add(data);
      return {
        user: data,
        token
      }
    }
  }

  if (event.api === 'getMessages') {
    return await db.collection('messages').where({
      public: true
    }).get();
  }

  // if (!event.token) {
  //   throw Error('未登录');
  // }

  // let auth = jwt.verify(event.token.replace('Bearer ', ''), jwtSecret);
  // let userId = auth.userId;

  if (event.api === 'publish') {
    let result = /* WxCheckMessage(userId) */ true;
    if (result.success === false) {
      return {
        success: false,
        errMsg: result.errMsg
      }
    }

    return await db.collection('messages').add({
      content: event.content,
      time: dateTime,
      backgroundColor: getColor(),
      public: true
      // userId
    })
  }

  if (event.api === 'getMyMessages') {
    return await db.collection('messages').where({
      userId
    }).get();
  }

  throw Error("No api");
};

function WxCheckMessage(userId) {
  let access_token_Res = uniCloud.httpclient.request(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${appSecret}`, {
      dataType: 'json'
    });
  let access_token = access_token_Res.data.access_token;
  let textRes = uniCloud.httpclient.request(
    `https://api.weixin.qq.com/wxa/msg_sec_check?access_token=${access_token}`, {
      method: 'POST',
      data: JSON.stringify({
        "version": 2,
        "openid": userId,
        "scene": 3,
        "content": event.content
      }),
      dataType: 'json'
    });
  console.log(textRes.data.result);
  if (textRes.data.result.suggest != "pass") {
    const lableDir = {
      100: "正常",
      10001: "广告",
      20001: "时政",
      20002: "色情",
      20003: "辱骂",
      20006: "违法犯罪",
      20008: "欺诈",
      20012: "低俗",
      20013: "版权",
      21000: "其他"
    }
    let label = textRes.data.result.label;
    return {
      success: false,
      errMsg: "无效:涉及" + lableDir[label]
    }
  }
  return {
    success: true
  }
}

const colorArray = ["#b0d5df", "#f0a1a8", "#f8d86a", "#add5a2", "#58C9B9", "#ffbbd6", "#80deea", "#FFEFBA", "#ecc0cd",
  "#93b5cf"
];
const ColorArrayLen = colorArray.length;

function getColor() {
  let randomNum = Math.random() * (ColorArrayLen - 1);
  let num = Math.round(randomNum);
  return colorArray[num];
}

function formatTime() {
  let time = getDate();
  let year = time.getFullYear();
  let month = time.getMonth() + 1;
  let dates = time.getDate();
  let hour = time.getHours();
  hour = hour < 10 ? '0' + hour : hour;
  let minute = time.getMinutes();
  minute = minute < 10 ? '0' + minute : minute;
  let second = time.getSeconds();
  second = second < 10 ? '0' + second : second;
  return year + '/' + month + '/' + dates + ' ' + hour + ':' + minute + ':' + second;
}

function getDate() {
  let localDate = new Date();
  let timezone = 8; // 目标时区时间，东八区   东时区正数 西市区负数
  let offset_GMT = localDate.getTimezoneOffset(); // 本地时间和格林威治的时间差，单位为分钟
  let nowTime = localDate.getTime(); // 本地时间距 1970 年 1 月 1 日午夜（GMT 时间）之间的毫秒数
  let targetDate = new Date(nowTime + offset_GMT * 60 * 1000 + timezone * 60 * 60 * 1000);
  return targetDate;
}
