<template>
    <div>
        <button @click="cropRect">crop</button>
        <canvas width="800" height="600" id="canvas" ref="canvasEl"></canvas>

    </div>

</template>

<script setup lang="ts">
import { fabric } from 'fabric-with-erasing'
import { ref, reactive, onMounted } from 'vue'
let fabricCanvas: fabric.Canvas | null = null

defineOptions({
    name: 'Demo'
})

const cropRect = () => {
    const rect = fabricCanvas?.getObjects()[0]
    if (rect) {
        rect.set({
            cropX: 50,
        })
        fabricCanvas?.clear()
        fabricCanvas?.add(rect)
        fabricCanvas?.renderAll()
    }
}

onMounted(() => {
    fabricCanvas = new fabric.Canvas('canvas', {
        isDrawingMode: true,
    })
    const rect = new fabric.Rect({
        width: 100,
        height: 100,
        fill: 'red',
    })
    fabricCanvas.add(rect)
    fabricCanvas.renderAll()
})


</script>

<style>
#app {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
#canvas {
    border: 1px solid red;
}
</style>
