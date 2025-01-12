'use strict';

const Service = require('egg').Service;

// const wandouHost = 'web.sesuzhi.org';
const wandouHost = 'https://web.longwangcs.cc';
const wandouWss = 'wss://wss.zhih.cc';

class WandouService extends Service {

  /**
   * 获取豌豆直播所有房间列表
   */
  async getAllRoom() {
    const { ctx } = this;
    const res = await ctx.curl(wandouHost + '/api/public/?service=Home.getHot&p=1');
    const data = JSON.parse(String(res.data));
    const list = data.data.info[0].list;
    // 排序后把 type === '2'，也就是在秀的排在前面，避免客户端再排序了
    const sortedList = list.filter(item => item.type !== '0').concat(list.filter(item => item.type === '0'));
    return sortedList;
  }

  /**
   * 获取连接 Websocket 用的数据，包括 url 和需要发送的data
   * @param {*} room 房间信息
   */
  async getWebsocket(room) {
    const { stream, uid } = room;
    const [ res1, res2 ] = await Promise.all([
      this.ctx.curl(`${wandouHost}/index.php?g=home&m=show&a=setNodeInfo&showid=${uid}&stream=${stream}`),
      this.ctx.curl(`https://wss.zhih.cc/socket.io/?EIO=3&transport=polling&t=${Date.now()}-0`),
    ]);
    const userData = JSON.parse(String(res1.data));
    const socketData = JSON.parse(String(res2.data).match(/^[^{]*({.*})$/)[1]);

    const { userinfo } = userData;
    const websocketData = {
      uid: userinfo.id,
      roomnum: String(userinfo.roomnum),
      stream: userinfo.stream,
      nickname: userinfo.user_nicename,
      equipment: 'pc',
      token: userinfo.token,
    };

    const websocketUrl = `${wandouWss}/socket.io/?EIO=3&transport=websocket&sid=${socketData.sid}`;

    return {
      url: websocketUrl,
      data: websocketData,
    };
  }
}

module.exports = WandouService;
