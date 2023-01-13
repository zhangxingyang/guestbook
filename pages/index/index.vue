<template>
  <view>
    <view class="inputArea">
      <input type="text" class="input" v-model="content" placeholder="在这里写上你的留言" />
      <button type="primary" @click="publish()" size="mini" style="margin-left: 5rpx;">发布</button>
      <button type="primary" @click="changeMode(); getList(mode)" size="mini"
        style="margin-left: 5rpx; padding-left: 15rpx; padding-right: 15rpx">
        <!-- <text v-if="mode==='getMessages'"> 所有留言</text>
        <text v-else>我的留言</text> -->
        <text>所有留言</text>
      </button>
    </view>
    <view class="status">
      <text>{{status}}</text>
    </view>
    <view class="message">
      <view v-for="item in list" :key="item._id">
        <view class="box" :style="{background: item.backgroundColor}">
          <view>
            <view style="font-size: 1.3rem; word-break: break-all;">{{item.content}}</view>
            <view style="font-size: 1rem;">{{item.time}}</view>
          </view>
          <view v-if="!item.public" style="color: #224e5b; margin: 30rpx;">未公开</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
  export default {
    data() {
      return {
        content: '',
        list: this.getList(),
        status: "正在加载留言",
        mode: "getMessages",
        timer: null
      }
    },
    onLoad() {
      // uni.login().then(({
      //   code
      // }) => {
      //   uniCloud.callFunction({
      //     name: "fun",
      //     data: {
      //       api: "loginWithMp",
      //       code
      //     }
      //   }).then(({
      //     result
      //   }) => {
      //     token = result.token;
      //     uni.setStorageSync('token', token);
      //     this.getList()
      //   })
      // })

      this.timer = setInterval(() => this.getList(this.mode), 2500)
    },
    onUnload() {
      clearInterval(this.timer)
    },
    methods: {
      getList(api) {
        uniCloud.callFunction({
          name: 'fun',
          data: {
            api: api || "getMessages",
            token: uni.getStorageSync('token')
          }
        }).then(res => {
          this.list = res.result.data;
          this.status = this.list == false ? "留言板是空的" : "所有留言内容";
        })
      },
      publish() {
        this.mode = "getMessages"
        if (!this.content.trim()) {
          uni.showToast({
            title: "留言无效",
            icon: "error"
          })
          this.status = "留言无效";
          return;
        }
        uniCloud.callFunction({
          name: 'fun',
          data: {
            api: 'publish',
            content: this.content
            // token: uni.getStorageSync('token')
          }
        }).then(res => {
          if (res.result.success === false) {
            console.log(res)
            console.log(res.result.errMsg)
            uni.showToast({
              icon: 'error',
              title: res.result.errMsg
            })
            this.content = "";
            this.status = "留言失败";
            return;
          }
          this.status = "留言成功";
          uni.showToast({
            title: "留言成功",
            icon: "success"
          })
          this.content = '';
        })
      },
      changeMode() {
        if (this.mode === "getMessages") {
          this.mode = "getMyMessages";
          return;
        }
        if (this.mode === "getMyMessages") {
          this.mode = "getMessages";
          return;
        }
      }
    }
  }
</script>

<style>
  .inputArea {
    display: flex;
    margin: 50rpx 30rpx;
    align-items: center;
    justify-content: center;
  }

  .input {
    border-bottom: 1px solid #ccc;
    padding: 3rpx;
    flex: 1;
  }

  .status {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin: 26rpx;
  }

  .title {
    font-size: 36rpx;
    color: #8f8f94;
  }

  .box {
    display: flex;
    margin: 23rpx 48rpx;
    border-bottom: 1px solid #ccc;
    padding: 38rpx;
    border-radius: 60rpx;
    line-height: 2.85;
    min-height: 7rem;
    flex-direction: row;
  }

  .message {
    display: flex;
    flex-direction: column-reverse;
    scroll-behavior: smooth;
  }
</style>
