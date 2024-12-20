
<template>
  <div class="drawing-container">
    <div class="tools">
      <button @click="setDrawingMode('pencil')" :class="{ active: currentTool === 'pencil' }">
        画笔
      </button>
      <button @click="setDrawingMode('eraser')" :class="{ active: currentTool === 'eraser' }">
        橡皮擦
      </button>
    </div>
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {fabric}   from 'fabric-with-erasing';

// 类型定义
type Tool = 'pencil' | 'eraser'

// refs
const canvasRef = ref<HTMLCanvasElement | null>(null)
const fabricCanvas = ref<fabric.Canvas | null>(null)
const currentTool = ref<Tool>('pencil')

// 初始化画布
const initCanvas = () => {
  if (!canvasRef.value) return
  
  fabricCanvas.value = new fabric.Canvas(canvasRef.value, {
    width: 800,
    height: 600,
    isDrawingMode: true
  })
}

// 加载图片
const loadImage = () => {
  if (!fabricCanvas.value) return

  fabric.Image.fromURL('./aa.jpg', (img) => {
    // 调整图片大小以适应画布
    img.scaleToWidth(fabricCanvas.value!.width!)
    
    // 设置图片为背景
    fabricCanvas.value!.setBackgroundImage(
      img,
      fabricCanvas.value!.renderAll.bind(fabricCanvas.value),
      {
        scaleX: img.scaleX,
        scaleY: img.scaleY
      }
    )
  })
}

// 设置绘画模式
const setDrawingMode = (tool: Tool) => {
  if (!fabricCanvas.value) return
  
  currentTool.value = tool
  fabricCanvas.value.isDrawingMode = true

  if (tool === 'pencil') {
    // 设置画笔
    fabricCanvas.value.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas.value)
    fabricCanvas.value.freeDrawingBrush.width = 5
    fabricCanvas.value.freeDrawingBrush.color = '#000000'
  } else if (tool === 'eraser') {
    // 设置橡皮擦
    fabricCanvas.value.freeDrawingBrush = new fabric.EraserBrush(fabricCanvas.value)
    fabricCanvas.value.freeDrawingBrush.width = 20
  }
}

// 生命周期钩子
onMounted(() => {
  initCanvas()
  loadImage()
  setDrawingMode('pencil')
})

onUnmounted(() => {
  fabricCanvas.value?.dispose()
})
</script>

<style scoped>
.drawing-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tools {
  display: flex;
  gap: 1rem;
}

button {
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

button.active {
  background-color: #e0e0e0;
}

canvas {
  border: 1px solid #ccc;
}
</style>