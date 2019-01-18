let Camera = (function () {
  const webCam = 0;
  const wsCam = 1;
  const jpgCam = 2;

  class Camera {
    // camType: 0,1,2 or http://192.168.0.11/jpg or ws://192.168.43.110:8889/rws/ws
    constructor(camType) {
      this.setCamType(camType);
      this.setRotateCam(0)
    }

    setRotateCam(degree) {
      this.rotateCam = degree;
    }

    getRotateCam() {
      return this.rotateCam;
    }

    setCamType(camType) {
      this.cameraList = [];
      if (isNaN(parseInt(camType))) {
        this.URL = camType;
        if (camType.indexOf("ws://") == 0) {
          this.camType = wsCam;
        } else if (camType.indexOf("http://") == 0) {
          this.camType = jpgCam;
        }
      } else {
        this.camType = parseInt(camType);
      }
    }

    enumerateDevices() {
      var self = this;
      return new Promise(function (resolve, reject) {
        navigator.mediaDevices.enumerateDevices()
          .then(function (o) {
            self.gotDevices(self, o);
            resolve();
          }).catch(self.handleError);
      });
    }

    gotDevices(self, deviceInfos) {
      for (var i = 0; i !== deviceInfos.length; ++i) {
        var deviceInfo = deviceInfos[i];
        if (deviceInfo.kind === 'videoinput') {
          self.cameraList.push(deviceInfo);
        }
      }
    }

    async startCam() {
      switch (this.camType) {
        case webCam:
          await this.enumerateDevices();
          if (window.stream) {
            window.stream.getTracks().forEach(function (track) {
              track.stop();
            });
          }
          var deviceId = 0;
          try {
            deviceId = this.cameraList[this.camType].deviceId;
          } catch (e) {
            console.log("can't found camType:", this.camType, "error:", e);
            console.log(this.cameraList);
          }
          var constraints = {
            video: {
              deviceId: { exact: deviceId }
            }
          };
          var self = this;
          navigator.mediaDevices.getUserMedia(constraints).
          then(function (stream) {
            if (self.video) {
              self.video.srcObject = stream;
            }
          }).catch(function (error) {
            console.log('Error: ', error);
          });
          break;
          /* WebRTC */
        case wsCam:
          console.log("WebRTC:", this.camType);
          ConnectWebSocket(this.URL);
          break;
        case jpgCam:
          // http://192.168.43.201:9966/ok.png
          console.log("JPGCam:", this.camType, " ,URL:", this.URL);
          //this.setRotateCam(90);
          break;
      }
    }

    getEle(eleOrId) {
      return typeof eleOrId === 'object' ?
        eleOrId : document.getElementById(eleOrId);
    }

    onImage(imageId_or_ele, callback) {
      var self = this;
      var image = this.getEle(imageId_or_ele);
      image.setAttribute("crossOrigin", 'Anonymous');
      var camSnapshotDelay = 0.5;
      var param = this.URL.indexOf("?");
      if (param > 0) {
        camSnapshotDelay = parseFloat(this.URL.substring(param + 1)) * 1000;
        this.URL = this.URL.substring(0, param);
      }
      image.src = this.URL;
      image.onload = function () {
        setTimeout(function () {
          if (typeof callback == 'function') {
            callback(image);
          }
          image.src = self.URL + "?" + Math.random();
        }, camSnapshotDelay);
      }
    }

    onCanvas(eleOrId, callback) {
      var self = this;
      var canvas = self.getEle(eleOrId);
      buttonTrigger(canvas, function () {
        self.startCam();
        switch (self.camType) {
          case webCam:
          case wsCam:
            var video = self.createVideo();
            window.remoteVideo = self.video = video;
            video.onloadeddata = function () {
              var loop = function () {
                var ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight,
                  0, 0, canvas.width, canvas.height);
                if (typeof callback == 'function') {
                  callback(canvas);
                }
                requestAnimationFrame(loop);
              }
              requestAnimationFrame(loop);
            }
            break;
          case jpgCam:
            self.onImage(document.createElement('img'), function (img) {
              var ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
              if (self.getRotateCam() > 0) {
                self.drawRotated(canvas, img, 90);
              }
              if (typeof callback == 'function') {
                callback(canvas);
              }
            });
            break;
        }
      });
    }

    toVideo(eleOrId) {
      var self = this;
      window.remoteVideo = self.video = this.getEle(eleOrId);
      buttonTrigger(self.video, function () {
        self.startCam();
      });
    }

    createVideo() {
      var video = document.createElement('video');
      video.autoplay = true;
      return video;
    }

    drawRotated(canvas, image, degrees) {
      var context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.save();
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate(degrees * Math.PI / 180);
      context.drawImage(image, -image.width / 2, -image.width / 2);
      context.restore();
    }
  }

  function buttonTrigger(ele, callback) {
    if (navigator.userAgent.indexOf("Chrome") < 0) {
      var btn = document.createElement("BUTTON");
      btn.setAttribute("style", "background-color: #e0f0e0;position: absolute;z-index:2;font-size:32px");
      document.getElementsByTagName("body")[0].append(btn);
      var rect = ele.getBoundingClientRect();
      btn.style.top = rect.top;
      btn.style.left = rect.left;
      btn.style.width = rect.width;
      btn.style.height = rect.height;
      btn.innerHTML = "Start Camera";
      btn.addEventListener('click', function (e) {
        btn.parentNode.removeChild(btn);
        callback();
      });
    } else {
      callback();
    }
  }

  return Camera;
})();