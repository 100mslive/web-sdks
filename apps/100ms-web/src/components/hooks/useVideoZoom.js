import { useEffect, useRef } from "react";

let scale = 1;
const factor = 0.01;
const max_scale = 1.425;

export const useVideoZoom = () => {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const element = ref.current;
    let start = { x: 0, y: 0 };
    let last = { x: 0, y: 0 };
    let isDown = false;
    const offset = element.getBoundingClientRect();

    const containedPan = (currentValue, offsetValue) => {
      return currentValue < 0
        ? Math.max(currentValue, -offsetValue)
        : Math.min(currentValue, offsetValue);
    };

    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && element.style.transform) {
        e.stopPropagation();
        scale = 1;
        const transformedMatrix = new DOMMatrixReadOnly()
          .scale(scale, scale)
          .translate(0, 0);
        element.style.transform = transformedMatrix.toString();
      }
    });

    element.addEventListener("wheel", e => {
      e.preventDefault();
      scale += e.deltaY * -factor;
      // Restrict scale
      scale = Math.min(Math.max(1, scale), max_scale);
      const transformedMatrix = new DOMMatrixReadOnly().scale(scale, scale);
      element.style.transform = transformedMatrix.toString();
    });

    function startDrag(event) {
      start.x = event.clientX - last.x;
      start.y = event.clientY - last.y;
      isDown = true;
    }

    function stopDrag(event) {
      isDown = false;
      last.x = event.clientX - start.x;
      last.y = event.clientY - start.y;
    }

    function whileDrag(event) {
      const currXPos = event.clientX;
      const currYPos = event.clientY;
      // Allow pan only when scaled
      if (scale === 1 || !isDown) {
        return;
      }
      const position = {
        x: currXPos - start.x,
        y: currYPos - start.y,
      };
      const width = element.clientWidth;
      const offsetX = width / 4 - offset.x; // allow pan by 1/4  - left offset
      const offsetY = offset.y;
      const transformedMatrix = new DOMMatrixReadOnly()
        .scale(scale)
        .translate(position.x, position.y);
      transformedMatrix.e = containedPan(transformedMatrix.e, offsetX);
      transformedMatrix.f = containedPan(transformedMatrix.f, offsetY);
      element.style.transform = transformedMatrix.toString();
    }

    element.addEventListener("mousedown", startDrag);
    element.parentElement.addEventListener("mousemove", whileDrag);
    element.parentElement.addEventListener("mouseup", stopDrag);
  }, []);
  return ref;
};
