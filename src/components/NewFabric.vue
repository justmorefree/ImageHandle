<template>
    <div class="box">
        <div class="box-header">
            <input type="file" @change="handleFileChange" />
            <button @click="openBrush">局部绘制</button>
            <button @click="openEraser">橡皮擦</button>
            <button @click="downloadMask">下载</button>
            <button @click="design">Design</button>
        </div>
        <div class="box-content">
            <canvas id="canvas" width="800" height="600"></canvas>
        </div>


    </div>
</template>

<script setup lang="ts">
import { fabric } from "fabric-with-erasing";
import { onMounted } from "vue";

let fabricCanvas: fabric.Canvas | null = null;
let myImg: fabric.Image | null = null;

// 图片的宽度是否大于高度
let imgIsHorizontal = false;
onMounted(() => {
    fabricCanvas = new fabric.Canvas('canvas', {
        width: 800,
        height: 600,
    });

    fabricCanvas.on('object:added', (e) => {
        console.log('object:added', e.target.toObject());
    });
    fabricCanvas.on('object:modified', (e) => {
        console.log('object:modified', e.target.toObject());
    });


    fabricCanvas.on('object:scal', (e) => {
        console.log('object:scaled', e.target.toObject());
    });
})

const design = () => {
    if (!fabricCanvas) return;
}

const openBrush = () => {
    if (!fabricCanvas) return;
    const pencilBrush = new fabric.PencilBrush(fabricCanvas);
    pencilBrush.width = 20;
    pencilBrush.color = "#ff00ff";
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
    const eraserBrush = new fabric.EraserBrush(fabricCanvas);
    eraserBrush.width = 20;
    eraserBrush.color = "red";
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
        clonedCanvas.remove(img);
        clonedCanvas.setZoom(1 / img.scaleX)
        clonedCanvas.forEachObject((obj: fabric.Object) => {
            if (obj.isType("path")) {
                obj.set({ fill: '#fff', stroke: '#fff' })
            }
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
    border: 1px solid green;

    .box-header {
        display: flex;
        align-items: center;
        height: 50px;
    }

    #canvas {}

    .box-content {
        height: 600px;
        width: 800px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
}
</style>
