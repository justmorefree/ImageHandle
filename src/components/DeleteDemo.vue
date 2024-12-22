<template>
    <div class="btn-x">
        <button @click="delCircle">删除元素（圆型）</button>
        <button @click="delRect">带动画删除元素（方形）</button>
    </div>
    <canvas id="canvasBox" width="600" height="600"></canvas>
</template>




<script setup>
import { fabric } from 'fabric-with-erasing'
let canvas = null
let circle = null
let rect = null

window.onload = function () {
    // 使用 元素id 创建画布，此时可以在画布上框选
    canvas = new fabric.Canvas('canvasBox', {
        width: 400,
        height: 400
    })

    // 圆形
    circle = new fabric.Circle({
        name: 'circle',
        top: 60,
        left: 60,
        radius: 30, // 圆的半径 30
        fill: 'yellowgreen'
    })

    // 矩形
    rect = new fabric.Rect({
        name: 'rect',
        top: 60, // 距离容器顶部 60px
        left: 200, // 距离容器左侧 200px
        fill: 'orange', // 填充a 橙色
        width: 60, // 宽度 60px
        height: 60 // 高度 60px
    })

    // 将矩形添加到画布中
    canvas.add(circle, rect)
}

// 删除圆形（没动画）
function delCircle() {
    canvas.remove(circle)
}

// 删除矩形（有动画）
function delRect() {
    canvas.FX_DURATION = 1500 // 设置动画时长，默认500毫秒

    canvas.fxRemove(rect, {
        onChange() {
            console.log('在动画的每一步调用')
        },
        onComplete() {
            console.log('删除成功后调用')
        }
    })
}
</script>