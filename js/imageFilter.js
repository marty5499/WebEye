class ImageFilter {
  constructor(cv) {
    this.cv = cv;
  }

  getOpenCV() {
    return this.cv;
  }

  dilation(src, size) {
    let dst = new cv.Mat();
    let M = cv.Mat.ones(size, size, cv.CV_8U);
    let anchor = new cv.Point(-1, -1);
    this.cv.dilate(src, dst, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    src.delete();
    return dst;
  }

  medianBlur(src, size) {
    let dst = new cv.Mat();
    this.cv.medianBlur(src, dst, size);
    src.delete();
    return dst;
  }

  erosion(src, size) {
    let dst = new this.cv.Mat();
    let M = this.cv.Mat.ones(size, size, this.cv.CV_8U);
    let anchor = new this.cv.Point(-1, -1);
    this.cv.erode(src, dst, M, anchor, 1, this.cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    src.delete();
    return dst;
  }

  gaussianBlur(src, size) {
    let dst = new cv.Mat();
    let ksize = new cv.Size(size, size);
    this.cv.GaussianBlur(src, dst, ksize, 0, 0, cv.BORDER_DEFAULT);
    src.delete();
    return dst;
  }

  enclosingCircle(src, size) {
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    //this.cv.findContours(src, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_TC89_L1);
    this.cv.findContours(src, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_TC89_KCOS);
    this.cv.cvtColor(src, src, cv.COLOR_GRAY2RGBA, 0);
    var objList = [];
    var count = 0;
    for (var i = 0; i < contours.size(); i++) {
      let cnt = contours.get(i);
      let circle = cv.minEnclosingCircle(cnt);
      if (size == 0 || circle.radius > size) {
        count++;
        objList.push({
          x: circle.center.x,
          y: circle.center.y,
          radius: circle.radius
        });
      }
    }
    if (count > 0) {
      //console.log("count:", count, contours.size());
    }
    return objList;
  }

  findContours(src) {
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    this.cv.findContours(src, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_TC89_KCOS);
    var size = contours.size();
    contours.delete();
    hierarchy.delete();
    return size;
  }
}