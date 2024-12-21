<script setup lang="ts">
// import { StaticCanvas, FabricText } from "fabric";
// const canvas = new StaticCanvas();
// const helloWorld = new FabricText('Hello world!');
// canvas.add(helloWorld);
// canvas.centerObject(helloWorld);

// const imageSrc = canvas.toDataURL();
// // some download code down here
// const a = document.createElement('a');
// a.href = imageSrc;
// a.download = 'image.png';
// document.body.appendChild(a);
// a.click();
// document.body.removeChild(a);


import DrawCanvas from './components/DrawCanvas.vue'
import FabricCanvas from './components/FabricCanvas.vue'
// import Demo from './components/Demo.vue'
</script>

<template>
  <FabricCanvas />
  <!-- <Demo /> -->
</template>

<style scoped></style>

