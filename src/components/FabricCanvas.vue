<template>
  <div class="sss"></div>
  <input type="file" @change="handleFileChange" ref="fileInputRef" />
  <button @click="openBrush" :disabled="!isLoadedImgRef">局部重绘</button>
  <button @click="openEraser" :disabled="!isLoadedImgRef">橡皮擦</button>
  <button @click="exitEditMode">退出编辑模式</button>

  <div class="canvasWrapper">
    <button @click="redoDraw" class="btnForward" :disabled="stateStack.length === 0">恢复</button>
    <button @click="undoDraw" class="btnBack" :disabled="disableUndoRef">撤销</button>
    <button @click="clearCanvas" class="btnClear" :disabled="!isLoadedImgRef || !isCanClearRef">清除</button>
    <button @click="downloadImg">下载</button>
    <button @click="handleDownload">下载蒙版</button>
    <canvas ref="canvasRef" width="800" height="600" class="canvas"></canvas>
  </div>

</template>


<script setup lang="ts">
import { fabric } from "fabric-with-erasing";
import { markRaw, onMounted, ref, watch, reactive, computed } from "vue";
import { getBase64SVG, getSvgEncode, isPencilBrush } from "../util";
// import { mosaicBrush } from "./MaSaiKe";



export interface CustomCursor {
  size: number;
  color: string;
  cursor: string;
}

let fabricCanvas: fabric.Canvas | null = null;
const canvasRef = ref<HTMLCanvasElement | null>(null);


const isLoadedImgRef = ref<boolean>(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const maxSaveStep = 20;
const stateStack = ref<any[]>([])
let currentGroup: fabric.Group | null = null;

const isDrawingModeRef = ref<boolean>(false);
const isInDrawingAreaRef = ref<boolean>(false);
const isCanClearRef = ref<boolean>(false);

const disableUndoRef = ref<boolean>(true);


// 自定义笔刷和橡皮擦的光标样式
const customBrushCursor: CustomCursor = reactive({
  size: 20,
  color: "red",
  cursor: "",
})

const customEraserCursor: CustomCursor = reactive({
  size: 20,
  color: "#c6c6c6",
  cursor: "",
})



const handleFileChange = (event: Event) => {
  isLoadedImgRef.value = false
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file || !fabricCanvas) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const imgUrl = e.target?.result as string;
    fabric.Image.fromURL(imgUrl, (img: any) => {
      // 设置图片大小适应画布
      const canvasWidth = fabricCanvas.width!;
      const canvasHeight = fabricCanvas.height!;
      const scale = Math.min(canvasWidth / img.width!, canvasHeight / img.height!);

      img.scale(scale);

      // 将图片居中显示
      img.set({
        left: (canvasWidth - img.width! * scale) / 2,
        top: (canvasHeight - img.height! * scale) / 2,
        erasable: false
      });

      const group = new fabric.Group([img]);
      group.objectCaching = false;
      fabricCanvas.add(markRaw(group));
      currentGroup = group;
      fabricCanvas.setActiveObject(group);

      isLoadedImgRef.value = true;
      fileInputRef.value!.value = "";

      // fabricCanvasRef.value.on('object:moving', function (e) {
      //   const target = e.target;
      //   if (target && target.type === 'path' && target.group === currentGroupRef.value) {
      //     const pointer = fabricCanvasRef.value.getPointer(e.e);
      //     const groupLeft = group.left;
      //     const groupTop = group.top;

      //     // 限制绘制范围在group边界内
      //     if (pointer.x < groupLeft) pointer.x = groupLeft;
      //     if (pointer.x > groupLeft + group.width) pointer.x = groupLeft + group.width;
      //     if (pointer.y < groupTop) pointer.y = groupTop;
      //     if (pointer.y > groupTop + group.height) pointer.y = groupTop + group.height;
      //   }
      // });
    });
  };
  reader.readAsDataURL(file);
};

onMounted(() => init());


const downloadImg = () => {
  if (!fabricCanvas) return;

  const tempCanvasElement = document.createElement('canvas');
  let tempCanvas: fabric.Canvas | null = null;
  const dpr = window.devicePixelRatio || 1;

  tempCanvas = new fabric.Canvas(tempCanvasElement, {
    enableRetinaScaling: true,
  });

  const allObjects = fabricCanvas.getObjects();
  if (allObjects.length === 0) return;
  const firstObject = allObjects[0];
  let width = 0;
  let height = 0;
  let scaleX = 1;
  let scaleY = 1;
  let imgObj: fabric.Image | null = null;

  if (firstObject.isType("group")) {
    imgObj = firstObject.getObjects().find((obj: fabric.Object) => obj.isType("image"));
    if (!imgObj) return;
    width = imgObj.width;
    height = imgObj.height;
    scaleX = imgObj.scaleX * firstObject.scaleX;
    scaleY = imgObj.scaleY * firstObject.scaleY;
  } else {
    imgObj = allObjects.find((obj: fabric.Object) => obj.isType("image"));
    if (!imgObj) return;
    width = imgObj.width;
    height = imgObj.height;
    scaleX = imgObj.scaleX;
    scaleY = imgObj.scaleY;
  }

  if (imgObj) {
    const targetWidth = width * scaleX;
    const targetHeight = height * scaleY;

    tempCanvas.set({
      width: targetWidth / dpr,
      height: targetHeight / dpr,
    });

    imgObj.clone((cloneImg: fabric.Image) => {
      cloneImg.set({
        left: 0,
        top: 0,
        width,
        height,
        scaleX: scaleX / dpr,
        scaleY: scaleY / dpr,
        originX: 'left',
        originY: 'top'
      });

      tempCanvas.clear();
      tempCanvas.add(cloneImg);
      tempCanvas.renderAll();

      try {
        const dataUrl = tempCanvas.toDataURL({
          format: 'jpeg',
          quality: 0.9,
          multiplier: dpr,
          enableRetinaScaling: true,
        });
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'canvas.jpeg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('下载图片时出错:', error);
      } finally {
        tempCanvas.clear();
        tempCanvas.getContext().clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCanvasElement.remove();
        cloneImg.dispose();
        tempCanvas = null;
      }
    });
  }
};



const handleDownload = () => {
  const tempCanvas = document.createElement('canvas')
  const tempFabricCanvas = new fabric.Canvas(tempCanvas, {
    fill: '#000',
  })

  currentGroup.clone((clonedGroup: fabric.Group) => {
    const img = clonedGroup.getObjects().find((obj: fabric.Object) => obj.isType("image"));
    if (!img) return;
    const orgImgWidth = img.width;
    const orgImgHeight = img.height;
    const totalScale = clonedGroup.scaleX * img.scaleX;
    tempCanvas.width = orgImgWidth
    tempCanvas.height = orgImgHeight

    clonedGroup.remove(img);
    tempFabricCanvas.remove(img);

    clonedGroup.forEachObject((obj: fabric.Object) => {
      if (obj.isType("path")) {
        obj.set({ fill: '#fff', stroke: '#fff' })
      }
    })

    clonedGroup.set({
      left: 0,
      top: 0,
      scaleX: 1 / totalScale,
      scaleY: 1 / totalScale,
    })

    tempFabricCanvas.add(clonedGroup)
    tempFabricCanvas.renderAll()

    try {
      const dataURL = tempFabricCanvas.toDataURL({
        format: 'jpeg',
        quality: 1,
        width: orgImgWidth,
        height: orgImgHeight
      })

      const link = document.createElement('a')
      link.download = 'canvas.jpeg'
      link.href = dataURL
      link.click()
    } catch (error) {
      console.error('下载图片时出错:', error);
    } finally {
      tempFabricCanvas.clear();
      tempFabricCanvas.getContext().clearRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCanvas.remove();
      clonedGroup.dispose();
    }
  })
}



const handleMouseUp = () => {
  fabricCanvas.setViewportTransform(fabricCanvas.viewportTransform) // 设置此画布实例的视口转换  
  fabricCanvas.isDragging = false
}

const handleMouseDown = (opt: any) => {
  let evt = opt.e
  fabricCanvas.isDragging = true // isDragging 是自定义的
  fabricCanvas.lastPosX = evt.clientX // lastPosX 是自定义的
  fabricCanvas.lastPosY = evt.clientY // lastPosY 是自定义的
}

const handleMouseMove = (opt: any) => {
  if (fabricCanvas.isDragging) {
    let evt = opt.e
    let vpt = fabricCanvas.viewportTransform // 聚焦视图的转换
    vpt[4] += evt.clientX - fabricCanvas.lastPosX
    vpt[5] += evt.clientY - fabricCanvas.lastPosY
    fabricCanvas.requestRenderAll()
    fabricCanvas.lastPosX = evt.clientX
    fabricCanvas.lastPosY = evt.clientY
  }
}


const init = () => {
  initFabricCanvas()
  initCursorStyle()
  setFabricControlsStyle();
  scaleEventListener();


  // 监听绘制线，绘制好后添加到组，以使拖动组时图片和线一起移动
  fabricCanvas.on('path:created', function (e: fabric.IEvent) {
    const path = e.path;
    fabricCanvas.remove(path);
    currentGroup.addWithUpdate(path);
    fabricCanvas.renderAll();

    if (isPencilBrush(path)) {
      // 笔刷path
      isCanClearRef.value = true;
      disableUndoRef.value = false;
      // 每次有新的path添加，都要重置状态栈
      stateStack.value = []
    }
  });

  fabricCanvas.on('erasing:end', function (e: fabric.IEvent) {
    // 橡皮擦path
    // 橡皮擦模式下一定是分组的，每次橡皮擦path更新后，都要检查此时画布是否还有PencilBrush Path,如果没有得Disable清除按钮
    // const findPencilBrush = fabricCanvas.getObjects().find((obj: fabric.Object) => isPencilBrush(obj as fabric.Path));
    // if (!findPencilBrush) {
    //   isCanClearRef.value = false;
    // }
  });

  // 监听鼠标移动，判断是否在可绘制区域
  fabricCanvas.on('mouse:move', function (e: fabric.IEvent) {
    if (!isLoadedImgRef.value) return
    isInDrawingAreaRef.value = isInGroup(e);
  });

  fabricCanvas.on('mouse:down', function (e: fabric.IEvent) {
    if (!isLoadedImgRef.value) return
    isInDrawingAreaRef.value = isInGroup(e);
  });

  fabricCanvas.on('mouse:up', function (e: fabric.IEvent) {
    if (!isLoadedImgRef.value) return
    isInDrawingAreaRef.value = isInGroup(e);
  });


  // fabricCanvasRef.value.on("mouse:wheel", (opt: any) => {
  //   if (!fabricCanvasRef.value) return;
  //   const delta = opt.e.deltaY // 滚轮，向上滚一下是 -100，向下滚一下是 100
  //   let zoom = fabricCanvasRef.value.getZoom() // 获取画布当前缩放值
  //   zoom *= 0.999 ** delta
  //   if (zoom > 20) zoom = 20
  //   if (zoom < 1) zoom = 1
  //   fabricCanvasRef.value!.zoomToPoint(
  //     { // 关键点
  //       x: opt.e.offsetX,
  //       y: opt.e.offsetY
  //     },
  //     zoom
  //   )
  //   opt.e.preventDefault()
  //   opt.e.stopPropagation()
  // });

  //fabricRegisterMouseEvents();

}






const initFabricCanvas = () => {
  if (!canvasRef.value) return;
  fabricCanvas = new fabric.Canvas(canvasRef.value, {
    width: canvasRef.value.width,
    height: canvasRef.value.height,
    isDrawingMode: false,
    selection: false,
    preserveObjectStacking: true, //对象被激活时，不改变对象的堆叠顺序
    controlsAboveOverlay: true,
  });
}

const initCursorStyle = () => {
  customBrushCursor.cursor = getSvgEncode(customBrushCursor)
  customEraserCursor.cursor = getSvgEncode(customEraserCursor)
}




const scaleEventListener = () => {
  // 设置对象缩放时，保持对象的宽高比
  fabricCanvas.on("object:scaling", (opt: any) => {
    console.log("object:scaling");
    const target = opt.target;
    const transform = opt.transform;
    if (target && target.set) {
      // 判断拖动的控制点位置
      if (transform.corner.includes('mt') || transform.corner.includes('mb')) {
        // 垂直方向缩放时，以 scaleY 为基准
        target.set({
          scaleX: target.scaleY
        });
      } else if (transform.corner.includes('ml') || transform.corner.includes('mr')) {
        // 水平方向缩放时，以 scaleX 为基准
        target.set({
          scaleY: target.scaleX
        });
      } else {
        // 对角线缩放时，以当前拖动产生的最大缩放比为基准
        const scale = Math.max(target.scaleX, target.scaleY);
        target.set({
          scaleX: scale,
          scaleY: scale
        });
      }
      fabricCanvas.requestRenderAll();
    }
  });
}



const isInGroup = (e: fabric.IEvent) => {
  if (!currentGroup) return false;
  const pointer = fabricCanvas.getPointer(e);
  const groupBounds = currentGroup.getBoundingRect();
  return pointer.x >= groupBounds.left &&
    pointer.x <= groupBounds.left + groupBounds.width &&
    pointer.y >= groupBounds.top &&
    pointer.y <= groupBounds.top + groupBounds.height;
}


const setFabricControlsStyle = () => {
  fabric.Object.prototype.set({
    borderColor: "#00e6ff",
    cornerColor: "#fff",
    cornerStyle: "circle",
    cornerStrokeWidth: 1,
    cornerStrokeColor: "#ccc",
    cornersize: 6,
    transparentCorners: false,
    borderScaleFactor: 2

  });
}

//注册鼠标事件
const fabricRegisterMouseEvents = () => {
  if (fabricCanvas) {
    fabricCanvas.on('mouse:down', handleMouseDown)
    fabricCanvas.on('mouse:move', handleMouseMove)
    fabricCanvas.on('mouse:up', handleMouseUp)
  }
};

//取消注册鼠标事件
const fabricUnregisterMouseEvents = () => {
  if (fabricCanvas) {
    fabricCanvas.off('mouse:down', handleMouseDown)
    fabricCanvas.off('mouse:move', handleMouseMove)
    fabricCanvas.off('mouse:up', handleMouseUp)
  }
};

const customCursorStyle = () => {
  fabricCanvas.hoverCursor = 'none'
  const customCursor = document.createElement('div');
  customCursor.style.width = '50px';
  customCursor.style.height = '50px';
  customCursor.style.border = '3px solid #ffffff';
  customCursor.style.background = 'rgba(255,255,255,0.6)'
  customCursor.style.borderRadius = '50%';
  customCursor.style.position = 'absolute';
  customCursor.style.pointerEvents = 'none';
  customCursor.style.display = 'none';

  // 设置自定义鼠标样式
  fabricCanvas.upperCanvasEl.style.cursor = 'none';
  fabricCanvas.wrapperEl.appendChild(customCursor);

}

// 开启笔刷功能
const openBrush = () => {
  regenerateGroup()
  setPencilBrush();
}

const setPencilBrush = () => {
  if (!fabricCanvas) return;
  fabricCanvas.freeDrawingCursor = getBase64SVG(customBrushCursor)
  const pencilBrush = new fabric.PencilBrush(fabricCanvas);
  pencilBrush.width = customBrushCursor.size;
  pencilBrush.color = customBrushCursor.color;
  fabricCanvas.freeDrawingBrush = pencilBrush;
  isDrawingModeRef.value = true;
  currentGroup.selectable = false;
  fabricCanvas.renderAll()


  // 马赛克笔刷
  // const brush = mosaicBrush(fabricCanvas);
  // // 这里不能少，否则画出来的内容不会生效，会被其他内容覆盖
  // brush.source = brush.getPatternSrc.call(brush);
  // fabricCanvas.freeDrawingBrush = brush;
  // fabricCanvas.freeDrawingBrush.width = 20;
  // isDrawingModeRef.value = true;
  // currentGroup.selectable = false;
  // fabricCanvas.requestRenderAll()
}



// 开启橡皮擦功能
const openEraser = () => {
  unGroup();
  setEraserBrush();
}

const setEraserBrush = () => {
  if (!fabricCanvas) return;
  fabricCanvas.freeDrawingCursor = getBase64SVG(customEraserCursor)
  const eraserBrush = new fabric.EraserBrush(fabricCanvas);
  eraserBrush.width = customEraserCursor.size;
  eraserBrush.color = customEraserCursor.color;
  fabricCanvas.freeDrawingBrush = eraserBrush;
  isDrawingModeRef.value = true;
  currentGroup.selectable = false;
  fabricCanvas.requestRenderAll()
}

// 解组
const unGroup = () => {
  if (fabricCanvas.getObjects()[0].isType("group")) {
    fabricCanvas.setActiveObject(currentGroup);
    fabricCanvas.getActiveObject().toActiveSelection()
    fabricCanvas.discardActiveObject();
  }
}

// 重新生成组
const regenerateGroup = () => {
  if (fabricCanvas.getObjects()[0].type !== 'group') {
    const selection = new fabric.ActiveSelection(fabricCanvas.getObjects(), {
      canvas: fabricCanvas
    });
    const group = selection.toGroup();
    group.objectCaching = false;
    currentGroup = group;
    fabricCanvas.discardActiveObject();
    fabricCanvas.requestRenderAll();
  }
}

watch([isInDrawingAreaRef, isDrawingModeRef, () => fabricCanvas], ([isInDrawingArea, isDrawingMode, fabricCanvas]) => {
  if (fabricCanvas) {
    const canDraw = isDrawingMode;
    if (isDrawingMode && !isInDrawingArea) {
      // const points = fabricCanvas.freeDrawingBrush?.decimatePoints();
      // if (points && points.length > 0) {
      //   fabricCanvas.freeDrawingBrush.createPath(points);
      // }
    }
    fabricCanvas.isDrawingMode = canDraw;
    // fabricCanvas.requestRenderAll();
  }
})



// 清除画布
const clearCanvas = () => {
  if (!fabricCanvas) return;
  const objects = fabricCanvas.getObjects();
  const firstObject = objects[0];
  if (firstObject.isType("group")) {
    firstObject.forEachObject((obj: fabric.Object) => {
      if (obj.isType("path")) {
        currentGroup.remove(obj);
        fabricCanvas.remove(obj);
      }
    });
  } else {
    objects.forEach((obj: fabric.Object) => {
      if (obj.isType("path")) {
        fabricCanvas.remove(obj);
      }
    });
  }
  fabricCanvas.renderAll();
  isCanClearRef.value = false;
  disableUndoRef.value = true;
}

// 退出编辑模式
const exitEditMode = () => {
  if (!fabricCanvas) return;
  regenerateGroup();
  isDrawingModeRef.value = false;
  currentGroup.selectable = true;
}


const undoDraw = () => {

  const allObjects = fabricCanvas.getObjects();
  if (allObjects.length > 0) {
    const firstObject = allObjects[0];
    if (firstObject.isType("group")) {
      const groupChildren = firstObject.getObjects()
      if (groupChildren.length > 0) {
        const lastChild = groupChildren.pop()
        if (lastChild.isType("path")) {
          stateStack.value.push(lastChild)
          firstObject.remove(lastChild)
          fabricCanvas.remove(lastChild)
        }
      }
    } else {
      const lastChild = allObjects.pop()
      if (lastChild.isType("path")) {
        stateStack.value.push(lastChild)
        fabricCanvas.remove(lastChild)
      }
    }
    fabricCanvas.renderAll()
    if (stateStack.value.length >= maxSaveStep) {
      disableUndoRef.value = true;
    }
  }
}

const redoDraw = () => {
  if (stateStack.value.length > 0) {
    const obj = stateStack.value.pop()
    const allObjects = fabricCanvas.getObjects();
    const firstObject = allObjects[0];
    if (firstObject.isType("group")) {
      firstObject.add(obj)
    }
    fabricCanvas.add(obj)
    fabricCanvas.renderAll()
    disableUndoRef.value = false;
  }
}



</script>





<style scoped lang="less">
.canvasWrapper {
  width: 800px;
  height: 600px;
  position: relative;

  canvas {
    background-image: repeating-conic-gradient(rgb(33, 37, 46) 0deg, rgb(33, 37, 46) 25%, rgb(45, 49, 59) 0deg, rgb(45, 49, 59) 50%);
    background-position: 0px 0px, 0.5rem 0.5rem;
    background-size: 1rem 1rem;
  }

  .btnActive {
    color: blueviolet;
  }

  .btnForward {
    position: absolute;
    top: 0;
    left: 100px;
    z-index: 1000;
  }

  .btnBack {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1000;
  }

  .btnClear {
    position: absolute;
    top: 0;
    left: 200px;
    z-index: 1000;
  }



}
</style>