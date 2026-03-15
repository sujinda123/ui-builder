import * as React from "react";
import { Breakpoint, ElementNode } from "@/lib/types";

type Dir = "n" | "e" | "s" | "w" | "ne" | "nw" | "se" | "sw";

type Action =
  | {
      kind: "move";
      id: string;
      startX: number;
      startY: number;
      startLeft: number;
      startTop: number;
    }
  | {
      kind: "resize";
      id: string;
      dir: Dir;
      startX: number;
      startY: number;
      startLeft: number;
      startTop: number;
      startWidth: number;
      startHeight: number;
      isFlow: boolean;
    };

export function useCanvasDnD(params: {
  containerStyles: { gap: number; layout: "row" | "column" | "stack" };
  scale: number;
  active: Breakpoint;
  selectedIds: string[];
  snap: (n: number) => number;
  setElements: React.Dispatch<React.SetStateAction<ElementNode[]>>;
}) {
  const { containerStyles, scale, active, selectedIds, snap, setElements } =
    params;

  const actionRef = React.useRef<Action | null>(null);

  // Helper to recursively update elements
  function updateElementsRecursive(
    elements: ElementNode[],
    updateFn: (el: ElementNode) => ElementNode,
  ): ElementNode[] {
    return elements.map((el) => {
      const updatedEl = updateFn(el)

      if (updatedEl.children && updatedEl.children.length > 0) {
        return {
          ...updatedEl,
          children: updateElementsRecursive(updatedEl.children, updateFn),
        }
      }

      return updatedEl
    })
  }

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const a = actionRef.current;
      if (!a) return;
      
      const dx = (e.clientX - a.startX) / scale;
      const dy = (e.clientY - a.startY) / scale;

      if (a.kind === "move") {
        setElements((prev) =>
          updateElementsRecursive(prev, (el) => {
            if (!selectedIds.includes(el.id)) return el;
            
            const newLeft = snap(
              Math.max(
                (el.id === a.id
                  ? (Number(a.startLeft) ?? 0)
                  : (Number(el.styles.left) ?? 0)) + dx,
                -1000 // Allow some out of bounds
              )
            );
            const newTop = snap(
              Math.max(
                (el.id === a.id ? (Number(a.startTop) ?? 0) : (Number(el.styles.top) ?? 0)) +
                  dy,
                -1000
              )
            );
            return {
              ...el,
              styles: { ...el.styles, left: newLeft, top: newTop },
            };
          })
        );
      } else {
        setElements((prev) =>
          updateElementsRecursive(prev, (el) => {
            if (el.id !== a.id) return el;
            
            let left = Number(a.startLeft) ?? 0;
            let top = Number(a.startTop) ?? 0;
            let width = Number(a.startWidth) ?? 0;
            let height = Number(a.startHeight) ?? 0;
            
            if (a.dir.includes("e")) width = a.startWidth + dx;
            if (a.dir.includes("s")) height = a.startHeight + dy;
            if (a.dir.includes("w")) {
              width = a.startWidth - dx;
              if (!a.isFlow) left = a.startLeft + dx;
            }
            if (a.dir.includes("n")) {
              height = a.startHeight - dy;
              if (!a.isFlow) top = a.startTop + dy;
            }
            
            width = snap(Math.max(width, 20));
            height = snap(Math.max(height, 20));
            
            const newStyles = { ...el.styles };
            const isHorizontal = a.dir.includes("e") || a.dir.includes("w");
            const isVertical = a.dir.includes("n") || a.dir.includes("s");

            if (isHorizontal) {
              newStyles.width = width;
              if (!a.isFlow && a.dir.includes("w")) newStyles.left = left;
            }

            if (isVertical) {
              newStyles.height = height;
              if (!a.isFlow && a.dir.includes("n")) newStyles.top = top;
            }

            return {
              ...el,
              styles: newStyles,
            };
          })
        );
      }
    },
    [scale, selectedIds, snap, setElements, updateElementsRecursive],
  );

  const onPointerUp = React.useCallback(() => {
    actionRef.current = null;
  }, []);

  const startMove = React.useCallback(
    (el: ElementNode, e: React.PointerEvent) => {
      // Check if we are in a state where moving is allowed
      // If parent is stack, we can move. 
      // But here we only check global containerStyles.
      // Ideally, we should check the immediate parent's layout.
      // But for now, let's assume if the element has absolute position, it can be moved.
      
      const isAbsolute = el.styles.position === "absolute" || containerStyles.layout === "stack";
      if (!isAbsolute) return;

      try {
        // We capture pointer on the canvas container (e.currentTarget's parent or similar?)
        // Actually RenderElement passes 'e' from its own div.
        // We want to capture on the *element itself* or the canvas? 
        // Usually capturing on the element being dragged is fine.
        (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      } catch {}
      
      e.preventDefault();
      e.stopPropagation(); // Important!

      // We need startX/Y relative to the *canvas root*.
      // e.clientX is global.
      // We need to find the canvas root to normalize.
      // But here we don't have ref to canvas root easily unless we use an ID or passed ref.
      // However, we can just use clientX/Y for delta calculation, IF we don't rely on 'rect.left' of the specific element.
      // In onPointerMove, we use (e.clientX - rect.left) where rect is canvas root.
      // So here we need to be consistent.
      
      // OPTION: We can't easily get canvas root rect here without ref.
      // BUT, we only need initial Mouse X/Y in "canvas space" OR "screen space" as long as onPointerMove uses the same.
      // onPointerMove uses: (e.clientX - canvasRect.left) / scale.
      
      // Let's rely on onPointerMove finding the canvas rect from e.currentTarget (which is the canvas div).
      // BUT startMove is called from the ELEMENT div. e.currentTarget is the ELEMENT.
      // This is a mismatch.
      
      // Fix: We should calculate startX/Y based on screen coordinates and handle offset in onPointerMove via deltas?
      // Actually, if we just store clientX/Y, and in onPointerMove we calculate delta from clientX/Y, it works regardless of container.
      // dx = (currentClientX - startClientX) / scale.
      
      actionRef.current = {
        kind: "move",
        id: el.id,
        startX: e.clientX,
        startY: e.clientY,
        startLeft: Number(el.styles.left) ?? 0,
        startTop: Number(el.styles.top) ?? 0,
      };
    },
    [containerStyles.layout],
  );

  const startResize = React.useCallback(
    (el: ElementNode, dir: Dir, e: React.PointerEvent, isFlow: boolean = false) => {
      // Allow resize for any element
      try {
        (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      } catch {}
      e.preventDefault();
      e.stopPropagation();

      // Get initial dimensions from DOM to handle "100%", "auto", etc.
      let startWidth = 0;
      let startHeight = 0;
      
      const handle = e.currentTarget as HTMLElement;
      // Handle is inside the element container (RenderElement div)
      const elementDiv = handle.closest('[data-element-id]') as HTMLElement;
      if (elementDiv) {
        // Use offsetWidth/offsetHeight for unscaled pixel values, then divide by scale if needed?
        // Actually, getBoundingClientRect includes scale transforms on parents.
        // We want the size in the coordinate system of the styles.
        // If the canvas is scaled by CSS transform, getBoundingClientRect returns scaled values.
        // So dividing by scale is correct IF the scale is applied via CSS transform on a parent we are measuring inside.
        
        const rect = elementDiv.getBoundingClientRect();
        startWidth = rect.width / scale;
        startHeight = rect.height / scale;
      } else {
        // Fallback to style (unsafe if string)
        startWidth = Number(el.styles.width) || 100;
        startHeight = Number(el.styles.height) || 100;
      }

      actionRef.current = {
        kind: "resize",
        id: el.id,
        dir,
        startX: e.clientX,
        startY: e.clientY,
        startLeft: Number(el.styles.left) || 0,
        startTop: Number(el.styles.top) || 0,
        startWidth,
        startHeight,
        isFlow,
      };
    },
    [scale],
  );

  return {
    onPointerMove,
    onPointerUp,
    startMove,
    startResize,
  };
}
