import { CustomCursor } from "./components/FabricCanvas.vue";
import { fabric } from "fabric-with-erasing";

export const getSvgEncode = (obj: CustomCursor) => {
  return encodeURIComponent(`
          <svg
            height="${obj.size}"
            width="${obj.size}"
            fill="${obj.color}"
            viewBox="0 0 ${obj.size * 2} ${obj.size * 2}"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="50%"
              cy="50%"
              r="${obj.size}" 
              opacity="0.5"
            />
          </svg>
    `);
};

export const getBase64SVG = (obj: CustomCursor) => {
  return `url('data:image/svg+xml;charset=utf-8,${obj.cursor}') ${
    obj.size / 2
  } ${obj.size / 2}, crosshair`;
};

export const isPencilBrush = (path: fabric.Path) => {
  return path.globalCompositeOperation !== 'destination-out';
}