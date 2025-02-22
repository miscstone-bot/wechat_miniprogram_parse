// index.ts
// 获取应用实例
const app = getApp<IAppOption>()

Component({
  properties: {
    id: {
      type: String,
      value: "1",
    } 
  },
  data: {
    currentTab: 0,
    parseTitle: "",
    coverImageUrl: "",
    imageList: [] as string[],
    switch2Checked: [] as boolean[],
    mainVideoUrl: "",
    liveVideoUrls: [] as string[],
    videoSwitch2Checked: [] as boolean[],
  },
  lifetimes: {
    attached() {
        this.fetchData();
    }
},
  methods: {
    fetchData() {
      console.log('fetch from index: '+this.properties.id)
      wx.request({
        url: 'http://127.0.0.1:3000/api/v2/wechat_bot/query?id='+this.properties.id,
        method: 'GET',
        success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
          console.log(res)

            if (res.statusCode === 200) {
                this.setData({
                  currentTab: 2,
                  parseTitle: res.data.title,
                  coverImageUrl: res.data.cover_url,
                  imageList: res.data.images,
                  switch2Checked: [] as boolean[],
                  mainVideoUrl: res.data.video_url,
                  liveVideoUrls: res.data.live_images_url,
                  videoSwitch2Checked: [] as boolean[],
                });
            } else {
                console.error('请求失败，状态码：', res.statusCode);
            }
        },
        fail: (err: WechatMiniprogram.GeneralCallbackResult) => {
            console.error('请求出错：', err);
        }
    });
    },
    switchTab(e: any) {
      const tabIndex = parseInt(e.currentTarget.dataset.index);
      this.setData({
        currentTab: tabIndex
      });
    },
    downloadMultiImage() {
      this.data.imageList.forEach((imageUrl, index) => {
        console.log(!this.data.switch2Checked[index])
        if (!this.data.switch2Checked[index]) {
          console.log("skip download")
          return
        }

        wx.downloadFile({
          url: imageUrl,
          success: (res) => {
            if (res.statusCode === 200) {
              wx.saveImageToPhotosAlbum({
                filePath: res.tempFilePath,
              });
            }
          },
          fail: (err) => {
            console.error(`第 ${index + 1} 张图片下载失败`, err);
          }
        });
      });
      wx.showToast({
        title: '下载成功',
        icon: 'success'
      });
    },
    downloadImage() {
      const url = this.data.coverImageUrl;
      wx.showLoading({
        title: '正在下载...',
      });
      wx.downloadFile({
        url: url,
        success: function (res) {
          if (res.statusCode === 200) {
            wx.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: function () {
                wx.hideLoading();
                wx.showToast({
                  title: '下载成功',
                  icon: 'success'
                });
              },
              fail: function (err) {
                wx.hideLoading();
                if (err.errMsg === "saveImageToPhotosAlbum:fail auth deny") {
                  wx.openSetting({
                    success: (res) => {
                      if (res.authSetting["scope.writePhotosAlbum"]) {
                        wx.showToast({
                          title: '已授权，可重新下载',
                          icon: 'none'
                        });
                      } else {
                        wx.showToast({
                          title: '未授权，无法下载',
                          icon: 'none'
                        });
                      }
                    }
                  });
                } else {
                  wx.showToast({
                    title: '下载失败',
                    icon: 'none'
                  });
                }
              }
            });
          }
        },
        fail: function () {
          wx.hideLoading();
          wx.showToast({
            title: '下载失败',
            icon: 'none'
          });
        }
      });
    },
    // checkbox 状态改变时触发的方法
    checkboxChange(e: any) { // 使用 any 类型绕过类型检查
      const index = e.currentTarget.dataset.index
      const tempSwitch2Checked = this.data.switch2Checked
      if (this.data.switch2Checked[index] === true) {
        tempSwitch2Checked[index] = false
      } else {
        tempSwitch2Checked[index] = true
      }

      this.setData({
        switch2Checked: tempSwitch2Checked
      })
      console.log(this.data.switch2Checked)
    },
    copyText() {
      wx.setClipboardData({
        data: this.data.parseTitle,
        success: () => {
          wx.showToast({
            title: '复制成功',
            icon: 'success',
            duration: 2000
          });
        },
        fail: () => {
          wx.showToast({
            title: '复制失败',
            icon: 'none',
            duration: 2000
          });
        }
      });
    },
    selectAllImage() {
      const length = this.data.imageList.length
      var i;
      const tempSwitch2Checked = this.data.switch2Checked
      for (i = 0; i < length; i++) {
        tempSwitch2Checked[i] = true
      }
      this.setData({
        switch2Checked: tempSwitch2Checked
      })
    },
    unSelectAllImage() {
      const length = this.data.imageList.length
      var i;
      const tempSwitch2Checked = this.data.switch2Checked
      for (i = 0; i < length; i++) {
        tempSwitch2Checked[i] = false
      }
      this.setData({
        switch2Checked: tempSwitch2Checked
      })
    },
    downloadMainVideo() {
      // 假设视频链接在data中定义
      const videoUrl = this.data.mainVideoUrl;
      wx.showModal({
        title: '提示',
        content: '是否下载视频？',
        success: (res) => {
          if (res.confirm) {
            wx.downloadFile({
              url: videoUrl,
              success: (downloadRes) => {
                if (downloadRes.statusCode === 200) {
                  // 下载成功，将视频保存到本地相册
                  wx.saveVideoToPhotosAlbum({
                    filePath: downloadRes.tempFilePath,
                    success: () => {
                      wx.showToast({
                        title: '下载成功',
                        icon: 'success'
                      });
                    },
                    fail: (saveRes) => {
                      wx.showToast({
                        title: '保存到相册失败：' + saveRes.errMsg,
                        icon: 'none'
                      });
                    }
                  });
                }
              },
              fail: (downloadRes) => {
                wx.showToast({
                  title: '下载失败：' + downloadRes.errMsg,
                  icon: 'none'
                });
              }
            });
          }
        }
      });
    },
    selectAllLive() {
      const length = this.data.liveVideoUrls.length
      var i;
      const tempSwitch2Checked = this.data.videoSwitch2Checked
      for (i = 0; i < length; i++) {
        tempSwitch2Checked[i] = true
      }
      this.setData({
        videoSwitch2Checked: tempSwitch2Checked
      })
    },
    unSelectAllLive() {
      const length = this.data.liveVideoUrls.length
      var i;
      const tempSwitch2Checked = this.data.videoSwitch2Checked
      for (i = 0; i < length; i++) {
        tempSwitch2Checked[i] = false
      }
      this.setData({
        videoSwitch2Checked: tempSwitch2Checked
      })
    },
    liveCheckboxChange(e: any) {
      const index = e.currentTarget.dataset.index
      const tempSwitch2Checked = this.data.videoSwitch2Checked

      if (this.data.videoSwitch2Checked[index] === true) {
        tempSwitch2Checked[index] = false
      } else {
        tempSwitch2Checked[index] = true
      }

      this.setData({
        videoSwitch2Checked: tempSwitch2Checked
      })
      console.log(this.data.videoSwitch2Checked)
    },
    downloadMultiLive() {
      this.data.liveVideoUrls.forEach((videoUrl, index) => {
        if (!this.data.videoSwitch2Checked[index]) {
          console.log("skip download")
          return
        }

        wx.downloadFile({
          url: videoUrl,
          success: (res) => {
            if (res.statusCode === 200) {
              wx.saveImageToPhotosAlbum({
                filePath: res.tempFilePath,
              });
            }
          },
          fail: (err) => {
            console.error(`第 ${index + 1} 张Live视频下载失败`, err);
          }
        });
      });
      wx.showToast({
        title: '下载成功',
        icon: 'success'
      });
    },
  },
})
