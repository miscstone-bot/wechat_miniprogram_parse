// index.ts
// 获取应用实例
const app = getApp()

Component({
  data: {
    currentTab: 0,
    parseTitle: "",
    coverImageUrl: "",
    imageList: [] as string[],
    switch2Checked: [] as boolean[],
    mainVideoUrl: "",
    liveVideoUrls: [] as string[],
    videoSwitch2Checked: [] as boolean[],
    hidden: 1,
    indexOptionID: 0,
  },
  lifetimes: {
    attached() {
      this.onLoad();
      this.fetchData();
      const intervalId = setInterval(() => {
        const fixIndexID = app.globalData.indexOptionID
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        const options = currentPage.options;
        const newUniqueID = options.id || '';
        console.log("compare start")
        console.log(newUniqueID,fixIndexID)
        console.log("compare end")

        if (newUniqueID!==fixIndexID) {
          app.globalData.indexOptionID=newUniqueID
          console.log('获取到的app index是:', app.globalData.indexOptionID)
          this.fetchData();
          // 清除定时器，避免重复创建
          clearInterval(intervalId);
          // 获取当前页面路径
          const currentPagePath = currentPage.route;
          // 执行页面刷新逻辑，重新加载页面并传递新的 uniqueID 参数
          console.log(`/${currentPagePath}?id=${app.globalData.indexOptionID}`)
          wx.navigateTo({
              url: `/${currentPagePath}?id=${app.globalData.indexOptionID}`
          });
        }
        console.log("=====")
      },4000)
    }
  },
  
  methods: {
    onLoad(options) {
      if (options !== undefined && options.id!== undefined) {
        const id = options.id;
        console.log('获取到的 id 是:', id);
        app.globalData.indexOptionID=id
        // 在这里可以进行后续的业务逻辑处理，比如根据 id 去请求数据等
        console.log('获取到的app index是:', app.globalData.indexOptionID)
      } else {
        console.log('未获取到有效的 id 参数');
      }
    },
    fetchData() {
      console.log('fetch from index: ' + app.globalData.indexOptionID)
      wx.request({
        url: 'https://332974rbtf31.vicp.fun/api/v2/wechat_bot/query?id=' + app.globalData.indexOptionID ,
        method: 'GET',
        success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
          console.log(res)
          if (res.statusCode === 200) {
            this.setData({
              parseTitle: res.data.title,
              coverImageUrl: res.data.cover_url,
              imageList: res.data.images,
              switch2Checked: [] as boolean[],
              mainVideoUrl: res.data.video_url,
              liveVideoUrls: res.data.live_images_url,
              videoSwitch2Checked: [] as boolean[],
              hidden: res.data.is_release,
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
              wx.saveVideoToPhotosAlbum({
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
