<script setup lang="ts">
import { fabric } from "fabric-with-erasing";
import { markRaw, onMounted, ref, watchEffect, watch } from "vue";

let fabricCanvas: fabric.Canvas | null = null;
const canvasRef = ref<HTMLCanvasElement | null>(null);


const isLoadedImgRef = ref<boolean>(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const maxSaveStep = 20;
const stateStack = ref<string[]>([]);
const canUndoRef = ref<boolean>(false);
const canRedoRef = ref<boolean>(false);
const stateIndexRef = ref<number>(-1);
const currentGroupRef = ref<fabric.Group | null>(null);


const handleFileChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file || !fabricCanvas) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const imgUrl = e.target?.result as string;
    fabric.Image.fromURL(imgUrl, (img: any) => {
      // 设置图片大小适应画布
      const canvasWidth = fabricCanvas.width!;
      const canvasHeight = fabricCanvas.height!;
      const scale = Math.min(
        canvasWidth / img.width!,
        canvasHeight / img.height!
      );

      img.scale(scale);

      // 将图片居中显示
      img.set({
        left: (canvasWidth - img.width! * scale) / 2,
        top: (canvasHeight - img.height! * scale) / 2,
        erasable: false
      });




      // fabricCanvasRef.value.on("mouse:down", (opt: any) => {
      //   const pointer = fabricCanvasRef.value.getPointer(opt.e);
      //   // 获取图片的边界
      //   const imageBounds = img.getBoundingRect();

      //   // 检查鼠标位置是否在图片区域内
      //   if (pointer.x >= imageBounds.left && pointer.x <= imageBounds.left + imageBounds.width &&
      //     pointer.y >= imageBounds.top && pointer.y <= imageBounds.top + imageBounds.height) {
      //     // 允许绘制
      //     fabricCanvasRef.value.isDrawingMode = true;
      //   } else {
      //     // 不在图片区域内，阻止绘制
      //     fabricCanvasRef.value.isDrawingMode = false;
      //   }
      // });

      // 设置为背景并禁止交互
      // fabricCanvasRef.value!.setBackgroundImage(
      //   img,
      //   fabricCanvasRef.value!.renderAll.bind(fabricCanvasRef.value),
      //   {
      //     selectable: false,
      //     erasable: false,
      //   }
      // );



      const group = new fabric.Group([img]);
      fabricCanvas.add(markRaw(group));
      currentGroupRef.value = group;
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
  setFabricControlsStyle();
  scaleEventListener();

  // 保存状态
  fabricCanvas.on("mouse:up", () => {
    saveState();
  });






  // 监听绘制线，绘制好后添加到组，以使拖动组时图片和线一起移动
  fabricCanvas.on('path:created', function (e: any) {
    const path = e.path;
    if (currentGroupRef.value) {
      // 将新创建的路径添加到组中
      fabricCanvas.remove(path);
      currentGroupRef.value.addWithUpdate(path);
      fabricCanvas.renderAll();
    }
    // if (path.globalCompositeOperation === 'destination-out') {
    //   console.log('这是橡皮擦操作');
    // }
    // else {
    // }
  });



  //-----设置鼠标样式-----
  // const customCursor = document.createElement('div');
  // customCursor.style.width = '50px';
  // customCursor.style.height = '50px';
  // customCursor.style.border = '3px solid #ffffff';
  // customCursor.style.background = 'rgba(255,255,255,0.6)'
  // customCursor.style.borderRadius = '50%';
  // customCursor.style.position = 'absolute';
  // customCursor.style.pointerEvents = 'none';
  // customCursor.style.display = 'none';

  // // 设置自定义鼠标样式
  // fabricCanvasRef.value.upperCanvasEl.style.cursor = 'none';
  // fabricCanvasRef.value.wrapperEl.appendChild(customCursor);

  // fabricCanvasRef.value.on('mouse:move', (event: any) => {
  //   fabricCanvasRef.value.upperCanvasEl.style.cursor = 'none';
  //   const pointer = fabricCanvasRef.value.getPointer(event.e);
  //   customCursor.style.left = pointer.x - 25 + 'px';
  //   customCursor.style.top = pointer.y - 25 + 'px';
  // })

  // fabricCanvasRef.value.on('mouse:out', () => {
  //   customCursor.style.display = 'none';
  // });

  // fabricCanvasRef.value.on('mouse:over', () => {
  //   customCursor.style.display = 'block';
  // });
  //-----设置鼠标样式-----





  // // 监听鼠标移动，判断是否在可绘制区域
  // fabricCanvasRef.value.on('mouse:move', function (e: Event) {
  //   if (!currentGroupRef.value) return;
  //   // 只在图片范围内启用绘制
  //   isInDrawingAreaRef.value = isInGroup(e);
  // });

  // fabricCanvasRef.value.on('mouse:down', function (e: Event) {
  //   isInDrawingAreaRef.value = isInGroup(e);
  // });

  // fabricCanvasRef.value.on('mouse:up', function (e: Event) {
  //   isInDrawingAreaRef.value = false;
  // });









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


const scaleEventListener = () => {
  // 设置对象缩放时，保持对象的宽高比
  fabricCanvas.on("object:scaling", (opt: any) => {
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

const isInGroup = (e: Event) => {
  const pointer = fabricCanvas.getPointer(e);
  const groupBounds = currentGroupRef.value.getBoundingRect();
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

const saveState = () => {
  stateStack.value.push(JSON.stringify(fabricCanvas.toDatalessJSON()));
  stateIndexRef.value = stateStack.value.length - 1;

}

// 开启笔刷功能
const openBrush = () => {
  regenerateGroup()
  setPencilBrush();
}

const setPencilBrush = () => {
  if (!fabricCanvas) return;
  console.log("open pencilBrush");
  const pencilBrush = new fabric.PencilBrush(fabricCanvas);
  pencilBrush.color = "#000";
  pencilBrush.width = 20;
  fabricCanvas.freeDrawingBrush = pencilBrush;
  fabricCanvas.isDrawingMode = true;
  currentGroupRef.value.selectable = false;
  fabricCanvas.requestRenderAll()
}

// 开启橡皮擦功能
const openEraser = () => {
  splitGroup();
  setEraserBrush();
}

const setEraserBrush = () => {
  if (!fabricCanvas) return;
  const eraserBrush = new fabric.EraserBrush(fabricCanvas);
  eraserBrush.width = 20;
  eraserBrush.color = "red";
  fabricCanvas.freeDrawingBrush = eraserBrush;
  fabricCanvas.isDrawingMode = true;
  currentGroupRef.value.selectable = false;
  fabricCanvas.requestRenderAll()
}

// 打散分组
const splitGroup = () => {
  fabricCanvas.setActiveObject(currentGroupRef.value);
  fabricCanvas.getActiveObject().toActiveSelection()
  fabricCanvas.discardActiveObject();
}

// 重新生成组
const regenerateGroup = () => {
  if (fabricCanvas.getObjects()[0].type !== 'group') {
    const selection = new fabric.ActiveSelection(fabricCanvas.getObjects(), {
      canvas: fabricCanvas
    });
    const group = selection.toGroup();
    currentGroupRef.value = group;
    fabricCanvas.discardActiveObject();
    fabricCanvas.requestRenderAll();
  }
}


// 判断是否可以撤销和前进
watchEffect(() => {
  canUndoRef.value = stateIndexRef.value > 0;
  canRedoRef.value = stateIndexRef.value < stateStack.value.length - 1;
})

// 撤销或者前进到指定画布状态
const historyStack = (index: number) => {
  if (canUndoRef.value || canRedoRef.value) {
    fabricCanvas.loadFromJSON(stateStack.value[index], () => {
      fabricCanvas.renderAll();
      stateIndexRef.value = index;
    });
  }
}

// 清除画布
const clearCanvas = () => {
  if (!fabricCanvas) return;
  fabricCanvas.clear();
  isLoadedImgRef.value = false;
}

// 退出编辑模式
const exitEditMode = () => {
  if (!fabricCanvas) return;
  regenerateGroup();
  fabricCanvas.isDrawingMode = false;
  currentGroupRef.value.selectable = true;
}



</script>


<template>
  <input type="file" @change="handleFileChange" ref="fileInputRef" />
  <button @click="openBrush" :disabled="!isLoadedImgRef">局部重绘</button>
  <button @click="openEraser" :disabled="!isLoadedImgRef">橡皮擦</button>
  <button @click="exitEditMode">退出编辑模式</button>

  <div class="canvasWrapper">
    <button @click="historyStack(stateIndexRef + 1)" class="btnForward" :disabled="!canRedoRef">前进</button>
    <button @click="historyStack(stateIndexRef - 1)" class="btnBack" :disabled="!canUndoRef">后退</button>
    <button @click="clearCanvas" class="btnClear" :disabled="!isLoadedImgRef">清除</button>
    <canvas ref="canvasRef" width="800" height="600"></canvas>
  </div>

</template>


<style scoped lang="less">
.canvasWrapper {
  width: 800px;
  height: 600px;
  position: relative;

  canvas {
    border: 1px solid red;
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