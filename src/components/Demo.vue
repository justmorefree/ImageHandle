<template>
    <div>
        <canvas width="800" height="600" id="canvas" ref="canvasEl"></canvas>
    </div>
    <button @click="updateConfig">change</button>
    <button @click="clear" style="margin-left: 30px;">clear</button>
</template>

<script setup>
import { fabric } from 'fabric-with-erasing'
import { ref, reactive, onMounted } from 'vue'
const canvasEl = ref(null)

defineOptions({
    name: 'Demo'
})

const state = reactive({
    canvas: null,
    cursor: '',
    size: 10,
    color: '#000'
})
onMounted(() => {
    // 初始化canvas
    state.canvas = new fabric.Canvas('canvas', {
        isDrawingMode: true,
    })
    // 更新画布设置
    updateConfig()
})

function updateConfig() {
    state.size = state.size + 10
    state.cursor = encodeURIComponent(`
        <svg
          height="${state.size}"
          width="${state.size}"
          fill="#c6c6c6"
          viewBox="0 0 ${state.size * 2} ${state.size * 2}"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="50%"
            cy="50%"
            r="${state.size}" 
            opacity="0.5"
          />
        </svg>
      `)
    state.canvas.freeDrawingCursor = `url('data:image/svg+xml;charset=utf-8,${state.cursor}') ${state.size / 2} ${state.size / 2}, crosshair`
    state.canvas.freeDrawingBrush = new fabric.PencilBrush(state.canvas)
    state.canvas.freeDrawingBrush.width = state.size;
}
function clear() {
    state.canvas.clear()
}
</script>

<style>
#app {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
</style>