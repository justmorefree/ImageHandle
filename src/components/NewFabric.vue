<template>
    <div class="box">
        <div class="box-header">
            <input type="file" @change="handleFileChange" />
            <button @click="openBrush">局部绘制</button>
            <button @click="openEraser">橡皮擦</button>
            <button @click="downloadMask">下载</button>
            <button @click="exitDraw">退出绘制</button>
        </div>
        <div class="box-content" ref="boxContentRef">
            <canvas id="canvas" width="800" height="600" ref="canvasDomRef"></canvas>
        </div>


    </div>
</template>

<script setup lang="ts">
import { fabric } from "fabric-with-erasing";
import { onMounted, ref } from "vue";
import { reactive } from "vue";
import { getSvgEncode, getBase64SVG } from "../util";


export interface CustomCursor {
    size: number;
    color: string;
    cursor: string;
}

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


let fabricCanvas: fabric.Canvas | null = null;
let myImg: fabric.Image | null = null;
const canvasDomRef = ref<HTMLCanvasElement | null>(null);
const boxContentRef = ref<HTMLDivElement | null>(null);

// 图片的宽度是否大于高度
let imgIsHorizontal = false;
onMounted(() => {
    initFabricCanvas()
    initCursorStyle()
})

const initFabricCanvas = () => {
    if (!canvasDomRef.value) return;
    fabricCanvas = new fabric.Canvas(canvasDomRef.value, {
        width: canvasDomRef.value.width,
        height: canvasDomRef.value.height,
    });
}

const initCursorStyle = () => {
    customBrushCursor.cursor = getSvgEncode(customBrushCursor)
    customEraserCursor.cursor = getSvgEncode(customEraserCursor)
}

const exitDraw = () => {
    if (!fabricCanvas || !boxContentRef.value) return;
    const objects = fabricCanvas.getObjects();
    objects.forEach((obj: fabric.Object) => {
        if (obj.isType("path")) fabricCanvas.remove(obj)
    })
    fabricCanvas.renderAll()
    fabricCanvas.isDrawingMode = false;
    myImg.set({ selectable: true })
    fabricCanvas.setWidth(boxContentRef.value.clientWidth)
    fabricCanvas.setHeight(boxContentRef.value.clientHeight)
    fabricCanvas.centerObject(myImg)
}

const openBrush = () => {
    if (!fabricCanvas) return;
    fabricCanvas.freeDrawingCursor = getBase64SVG(customBrushCursor)
    const pencilBrush = new fabric.PencilBrush(fabricCanvas);
    pencilBrush.width = customBrushCursor.size;
    pencilBrush.color = customBrushCursor.color;
    fabricCanvas.freeDrawingBrush = pencilBrush;
    fabricCanvas.isDrawingMode = true;
    fabricCanvas.renderAll()

    if (!myImg) return;
    // 自适应图片的一边到画布尺寸
    if (imgIsHorizontal) {
        myImg.scaleToWidth(fabricCanvas.width!);
        const imgHeight = myImg.getScaledHeight();
        fabricCanvas.setHeight(imgHeight);
        myImg.set({
            top: 0,
            left: 0,
            selectable: false
        });
        myImg.setCoords();
        fabricCanvas.renderAll()
    } else {
        myImg.scaleToHeight(fabricCanvas.height!);
        const imgWidth = myImg.getScaledWidth();
        fabricCanvas.setWidth(imgWidth);
        myImg.set({
            top: 0,
            left: 0,
            selectable: false
        });
        myImg.setCoords();
        fabricCanvas.renderAll()
    }
}

const openEraser = () => {
    if (!fabricCanvas) return;
    fabricCanvas.freeDrawingCursor = getBase64SVG(customEraserCursor)
    const eraserBrush = new fabric.EraserBrush(fabricCanvas);
    eraserBrush.width = customEraserCursor.size;
    eraserBrush.color = customEraserCursor.color;
    fabricCanvas.freeDrawingBrush = eraserBrush;
    fabricCanvas.isDrawingMode = true;
    fabricCanvas.requestRenderAll()
}

const handleFileChange = (event: Event) => {

    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !fabricCanvas) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const imgUrl = e.target?.result as string;
        fabric.Image.fromURL(imgUrl, (img: fabric.Image) => {
            myImg = img;
            // 设置图片大小适应画布
            const canvasWidth = fabricCanvas.width!;
            const canvasHeight = fabricCanvas.height!;
            const scale = Math.min(canvasWidth / img.width!, canvasHeight / img.height!);
            imgIsHorizontal = img.width! > img.height!;

            img.scale(scale);

            // 将图片居中显示
            img.set({
                left: (canvasWidth - img.width! * scale) / 2,
                top: (canvasHeight - img.height! * scale) / 2,
                erasable: false,
            });

            fabricCanvas.add(img);
        });
    };
    reader.readAsDataURL(file);
};


const downloadMask = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clone((clonedCanvas: fabric.Canvas) => {
        const img = clonedCanvas.getObjects().find((obj: fabric.Object) => obj.isType("image"));
        if (!img) return;
        clonedCanvas.set({ fill: '#000' })
        clonedCanvas.remove(img);
        clonedCanvas.setZoom(1 / img.scaleX)
        clonedCanvas.forEachObject((obj: fabric.Object) => {
            if (obj.isType("path")) obj.set({ stroke: '#fff' })
        })

        try {
            const dataURL = clonedCanvas.toDataURL({
                format: 'jpeg',
                quality: 1,
                width: img.width,
                height: img.height
            })

            const link = document.createElement('a')
            link.download = 'canvas.jpeg'
            link.href = dataURL
            link.click()
        } catch (error) {
            console.error('下载图片时出错:', error);
        }
    })
}

</script>

<style scoped lang="less">
.box {
    width: 800px;
    height: 652px;


    .box-header {
        display: flex;
        align-items: center;
        height: 50px;
    }

    #canvas {
        border: 1px solid red;
    }

    .box-content {
        border: 1px solid green;
        height: 600px;
        width: 800px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
}
</style>
