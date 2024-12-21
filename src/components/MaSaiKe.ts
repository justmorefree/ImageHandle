
import { fabric } from 'fabric-with-erasing';
const mosaicify = (imageData: ImageData) => {
  const { data } = imageData;
  const iLen = imageData.height;
  const jLen = imageData.width;
  let index; let i; let j; let r; let g; let b; let a; let _i; let _j; let _iLen; let _jLen;
  // const { blockSize } = this;
  const blockSize = 20;
  for (i = 0; i < iLen; i += blockSize) {
    for (j = 0; j < jLen; j += blockSize) {
      index = (i * 4 * jLen) + (j * 4);
      r = data[index];
      g = data[index + 1];
      b = data[index + 2];
      a = data[index + 3];

      _iLen = Math.min(i + blockSize, iLen);
      _jLen = Math.min(j + blockSize, jLen);
      for (_i = i; _i < _iLen; _i++) {
        for (_j = j; _j < _jLen; _j++) {
          index = (_i * 4 * jLen) + (_j * 4);
          data[index] = r;
          data[index + 1] = g;
          data[index + 2] = b;
          data[index + 3] = a;
          /*
          data[index] = 0;
          data[index + 1] = 0;
          data[index + 2] = 0;
          */
        }
      }
    }
  }
};

export const mosaicBrush = (fabricCanvas: fabric.Canvas): any => {
  const squareBrush = new fabric.PatternBrush(fabricCanvas);
  // getPatternSrc  取得要重复绘製的图形 Canvas
  squareBrush.getPatternSrc = function() {
    // 创立一个暂存 canvas 来绘製要画的图案
    const cropping = {
      left: 0,
      top: 0,
      width: fabricCanvas.width,
      height: fabricCanvas.height,
    };
    const imageCanvas = fabricCanvas.toCanvasElement(1, cropping);
    const imageCtx: any = imageCanvas.getContext('2d');
    const imageData = imageCtx.getImageData(0, 0, imageCanvas.width, imageCanvas.height);
    mosaicify(imageData);
    imageCtx.putImageData(imageData, 0, 0);

    const patternCanvas = (fabric as any).document.createElement('canvas'); // 这里的ceateElement一定要使用fabric内置的方法
    const patternCtx: any = patternCanvas.getContext('2d');
    patternCanvas.width = fabricCanvas.width || 0;
    patternCanvas.height = fabricCanvas.height || 0;
    patternCtx.drawImage(
      imageCanvas,
      0, 0, imageCanvas.width, imageCanvas.height,
      cropping.left, cropping.top, cropping.width, cropping.height
    );
    return patternCanvas;
  };
  return squareBrush;
};