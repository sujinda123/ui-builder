import * as React from "react";
import { Button } from "@/components/ui/button";
import { Breakpoint, ElementNode, ElementType } from "@/lib/types";
import { clampNum } from "@/lib/math";
import { PresetName } from "@/lib/presets";
import Image from "next/image";
import { useCanvasDnD } from "@/hooks/useCanvasDnD";

// Recursive Component
const RenderElement = ({
  el,
  selectedId,
  selectedIds,
  toggleSelect,
  selectOnly,
  dnd,
  containerLayout,
  onDrop,
}: {
  el: ElementNode;
  selectedId: string | null;
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  selectOnly: (id: string | null) => void;
  dnd: any;
  containerLayout: "row" | "column" | "stack";
  onDrop: (e: React.DragEvent, parentId?: string) => void;
}) => {
  const isSelected = selectedIds.includes(el.id);
  const isContainer = ["row", "column", "grid", "box"].includes(el.type);

  // Stop propagation for selection to avoid selecting parent when clicking child
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (e.shiftKey || e.ctrlKey) {
      toggleSelect(el.id);
    } else {
      selectOnly(el.id);
    }
    if (selectedId === el.id) {
      dnd.startMove(el, e);
    }
  };

  return (
    <div
      key={el.id}
      data-element-id={el.id}
      onPointerDown={handlePointerDown}
      draggable={containerLayout !== "stack"} // Only draggable if parent is not stack (or handle specially)
      onDragStart={(e) => {
         e.stopPropagation();
         e.dataTransfer.setData("text/reorder-id", el.id);
         e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => {
        if (isContainer) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onDrop={(e) => {
        if (isContainer) {
          e.preventDefault();
          e.stopPropagation();
          onDrop(e, el.id);
        }
      }}
      className={[
        "relative select-none",
        isContainer ? "border border-dashed border-zinc-300/50" : "border border-zinc-300/30",
        isSelected ? "ring-2 ring-blue-500 z-10" : "",
      ].join(" ")}
      style={{
        width: el.styles.width,
        height: el.styles.height,
        backgroundColor: el.styles.backgroundColor ?? (isContainer ? "transparent" : "rgba(250,250,250,0.5)"),
        color: el.styles.color ?? "inherit",
        zIndex: el.styles.zIndex,
        position: containerLayout === "stack" ? "absolute" : "relative",
        left: el.styles.left,
        top: el.styles.top,
        borderRadius: el.styles.borderRadius,
        opacity: el.styles.opacity,
        border: el.styles.border,
        boxShadow: el.styles.boxShadow,
        padding: el.styles.padding,
        fontSize: el.styles.fontSize,
        fontWeight: el.styles.fontWeight,
        textAlign: el.styles.textAlign,
        display: el.styles.display,
        flexDirection: el.styles.flexDirection,
        gap: el.styles.gap,
        alignItems: el.styles.alignItems,
        justifyContent: el.styles.justifyContent,
        gridTemplateColumns: el.styles.gridTemplateColumns,
        cursor: containerLayout === "stack" && isSelected ? "move" : "default",
        flexShrink: 0, // Prevent shrinking when siblings expand
      }}
    >
      {/* Render content based on type */}
      {el.type === "text" ? (
        <span className="pointer-events-none text-xs w-full h-full">{el.text}</span>
      ) : el.type === "heading" ? (
        <h1 className="pointer-events-none w-full h-full m-0">{el.text}</h1>
      ) : el.type === "button" ? (
        <Button className="h-full w-full text-xs pointer-events-none">{el.text ?? el.label}</Button>
      ) : el.type === "image" ? (
        <Image
          src={el.src ?? "data:image/gif;base64,R0lGODlhAQABAAAAACw="}
          alt={el.label}
          fill
          unoptimized
          className="pointer-events-none object-cover rounded-md"
        />
      ) : el.type === "video" ? (
        <video src={el.src} controls className="w-full h-full object-cover pointer-events-none" />
      ) : el.type === "iframe" ? (
         <div className="w-full h-full bg-zinc-100 grid place-items-center text-xs text-zinc-400 pointer-events-none">Iframe Placeholder</div>
      ) : el.type === "link" ? (
        <a href={el.href} className="text-blue-600 underline pointer-events-none">{el.text}</a>
      ) : el.type === "code" ? (
        <pre className="w-full h-full overflow-hidden text-[10px] pointer-events-none">{el.code}</pre>
      ) : null}

      {/* Render Children */}
      {el.children?.map((child) => (
        <RenderElement
          key={child.id}
          el={child}
          selectedId={selectedId}
          selectedIds={selectedIds}
          toggleSelect={toggleSelect}
          selectOnly={selectOnly}
          dnd={dnd}
          containerLayout={["row", "column", "box", "grid"].includes(el.type) ? "column" : "stack"}
          onDrop={onDrop}
        />
      ))}

      {/* Resize Handles (always show for selected elements) */}
      {isSelected && (
        <div className="pointer-events-none absolute inset-0">
              <div
                className="pointer-events-auto absolute -top-1 -left-1 h-2 w-2 rounded-sm bg-blue-500 cursor-nwse-resize"
                onPointerDown={(e) => dnd.startResize(el, "nw", e, containerLayout !== "stack")}
              />
              <div
                className="pointer-events-auto absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-sm bg-blue-500 cursor-ns-resize"
                onPointerDown={(e) => dnd.startResize(el, "n", e, containerLayout !== "stack")}
              />
              <div
                className="pointer-events-auto absolute -top-1 -right-1 h-2 w-2 rounded-sm bg-blue-500 cursor-nesw-resize"
                onPointerDown={(e) => dnd.startResize(el, "ne", e, containerLayout !== "stack")}
              />
              <div
                className="pointer-events-auto absolute top-1/2 -left-1 -translate-y-1/2 h-2 w-2 rounded-sm bg-blue-500 cursor-ew-resize"
                onPointerDown={(e) => dnd.startResize(el, "w", e, containerLayout !== "stack")}
              />
              <div
                className="pointer-events-auto absolute top-1/2 -right-1 -translate-y-1/2 h-2 w-2 rounded-sm bg-blue-500 cursor-ew-resize"
                onPointerDown={(e) => dnd.startResize(el, "e", e, containerLayout !== "stack")}
              />
              <div
                className="pointer-events-auto absolute -bottom-1 -left-1 h-2 w-2 rounded-sm bg-blue-500 cursor-nesw-resize"
                onPointerDown={(e) => dnd.startResize(el, "sw", e, containerLayout !== "stack")}
              />
              <div
                className="pointer-events-auto absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-sm bg-blue-500 cursor-ns-resize"
                onPointerDown={(e) => dnd.startResize(el, "s", e, containerLayout !== "stack")}
              />
              <div
                className="pointer-events-auto absolute -bottom-1 -right-1 h-2 w-2 rounded-sm bg-blue-500 cursor-nwse-resize"
                onPointerDown={(e) => dnd.startResize(el, "se", e, containerLayout !== "stack")}
              />
              <div className="pointer-events-none absolute -top-6 left-0 rounded bg-zinc-900/80 px-1.5 py-0.5 text-[10px] text-zinc-300 whitespace-nowrap z-50">
                {el.label} {Math.round(Number(el.styles.width))}×{Math.round(Number(el.styles.height))}
              </div>
        </div>
      )}
    </div>
  );
};

export function CanvasArea(props: {
  elements: ElementNode[];
  selectedId: string | null;
  selectedIds: string[];
  containerStyles: { gap: number; layout: "row" | "column" | "stack" };
  active: Breakpoint;
  scale: number;
  snap: (n: number) => number;
  selected: ElementNode | null;
  addElement: (type: ElementType, parentId?: string) => void;
  addElementAt: (type: ElementType, x: number, y: number, parentId?: string) => void;
  addPresetAt: (preset: PresetName, x: number, y: number) => void;
  setElements: React.Dispatch<React.SetStateAction<ElementNode[]>>;
  toggleSelect: (id: string) => void;
  selectOnly: (id: string | null) => void;
  moveElement: (dragId: string, targetParentId: string | null, targetIndex?: number, updateStyles?: any) => void;
}) {
  const {
    elements,
    selectedId,
    selectedIds,
    containerStyles,
    active,
    scale,
    snap,
    setElements,
    toggleSelect,
    selectOnly,
    addElement,
    addElementAt,
    addPresetAt,
    moveElement,
  } = props;

  const dnd = useCanvasDnD({
    containerStyles,
    scale,
    active,
    selectedIds,
    snap,
    setElements,
  });

  const handleDrop = (e: React.DragEvent, parentId?: string) => {
    const typeStr = e.dataTransfer.getData("text/element-type") as ElementType;
    const presetStr = e.dataTransfer.getData("text/preset") as PresetName;
    const reorderId = e.dataTransfer.getData("text/reorder-id");

    if (!typeStr && !presetStr && !reorderId) return;

    // Handle Drop Logic
    // 1. New Element
    if (typeStr) {
      if (parentId) {
         addElement(typeStr, parentId);
      } else {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const x = (e.clientX - rect.left - 10) / scale;
        const y = (e.clientY - rect.top - 10) / scale;
        
        if (containerStyles.layout === "stack") {
           addElementAt(typeStr, x, y);
        } else {
           addElement(typeStr);
        }
      }
    }
    // 2. Preset (Only on root for now)
    else if (presetStr && !parentId) {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const x = (e.clientX - rect.left - 10) / scale;
        const y = (e.clientY - rect.top - 10) / scale;
        addPresetAt(presetStr, x, y);
    }
    // 3. Reorder / Move
    else if (reorderId) {
        // Prevent dropping on self or children (simple check: if dragId == parentId)
        if (reorderId === parentId) return;

        // Determine Index via data-element-id
        let targetIndex: number | undefined = undefined;
        // Check if we dropped ON another element to insert before/after
        // This is tricky because e.target might be the container background if we missed children
        // or a child element.
        
        // We can look at the element under the cursor.
        // But e.target is the element that fired the event.
        // If we dropped on container, e.target is container (or child if bubbling, but we stopped propagation in child if it is container)
        
        // Wait, if we drop on a *leaf* child inside container, the event bubbles to container's onDrop.
        // So e.target is the leaf child.
        const targetEl = (e.target as HTMLElement).closest('[data-element-id]');
        if (targetEl) {
           const targetId = targetEl.getAttribute('data-element-id');
           if (targetId && targetId !== reorderId && targetId !== parentId) {
             // Find index of targetId in parent's children
             // We don't have the list here easily. 
             // We can pass elements to a helper or just move to parent and let useEditor handle index?
             // But useEditor needs index.
             
             // Let's iterate elements to find parent and index
             const findIndex = (list: ElementNode[]): number => {
                return list.findIndex(x => x.id === targetId);
             };
             // We need to find the parent first to get its list.
             // Actually, we know parentId is the container. So we just need to find parentId in elements tree
             // and get its children, then find targetId index.
             
             const findChildren = (list: ElementNode[], pid: string | undefined): ElementNode[] | null => {
                if (!pid) return list; // Root
                for (const el of list) {
                   if (el.id === pid) return el.children || [];
                   if (el.children) {
                      const res = findChildren(el.children, pid);
                      if (res) return res;
                   }
                }
                return null;
             };

             const children = findChildren(elements, parentId);
             if (children) {
                const idx = children.findIndex(x => x.id === targetId);
                if (idx !== -1) {
                   // Insert after if mouse is on right half? Or just before.
                   // Simple: insert before
                   targetIndex = idx;
                }
             }
           }
        }

        // Calculate position if target is stack
        let updateStyles: any = undefined;
        
        // Find parent to check layout
        const findElement = (list: ElementNode[], id: string): ElementNode | null => {
           for (const el of list) {
              if (el.id === id) return el;
              if (el.children) {
                 const found = findElement(el.children, id);
                 if (found) return found;
              }
           }
           return null;
        };

        const parent = parentId ? findElement(elements, parentId) : null;
        // Root is stack if containerStyles.layout is stack (and no parentId)
        // Or check parent.type/layout
        
        const isTargetStack = parent 
           ? (parent.type === "box" ? false : false) // Box is always column for now? Actually Box is flex column. 
           : containerStyles.layout === "stack";
           
        // Wait, we need to know if the target container allows absolute positioning.
        // Currently only Root Stack allows absolute.
        // Nested "Stack" elements? Not yet implemented fully.
        // But if we drop on Root and Root is Stack.
        
        if (!parent && containerStyles.layout === "stack") {
           const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
           const x = snap((e.clientX - rect.left - 10) / scale);
           const y = snap((e.clientY - rect.top - 10) / scale);
           updateStyles = { left: x, top: y, position: "absolute" };
        }

        moveElement(reorderId, parentId ?? null, targetIndex, updateStyles);
    }
  };

  return (
    <div
      className="absolute inset-0 p-10 select-none"
      onPointerMove={dnd.onPointerMove}
      onPointerUp={dnd.onPointerUp}
      onPointerCancel={dnd.onPointerUp}
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => handleDrop(e)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (containerStyles.layout !== "stack" || selectedIds.length === 0)
          return;
        const step = e.shiftKey ? 10 : 1;
        let dx = 0;
        let dy = 0;
        if (e.key === "ArrowLeft") dx = -step;
        if (e.key === "ArrowRight") dx = step;
        if (e.key === "ArrowUp") dy = -step;
        if (e.key === "ArrowDown") dy = step;
        if (dx !== 0 || dy !== 0) {
          setElements((prev) =>
            prev.map((el) => {
              if (!selectedIds.includes(el.id)) return el;
              const newLeft = snap(
                clampNum(
                  (Number(el.styles.left) ?? 0) + dx,
                  0,
                  active.width - (Number(el.styles.width) ?? 0),
                ),
              );
              const newTop = snap(
                clampNum(
                  (Number(el.styles.top) ?? 0) + dy,
                  0,
                  active.height - (Number(el.styles.height) ?? 0),
                ),
              );
              return {
                ...el,
                styles: { ...el.styles, left: newLeft, top: newTop },
              };
            }),
          );
          e.preventDefault();
        }
      }}
      style={{
        display: containerStyles.layout === "stack" ? "block" : "flex",
        flexDirection:
          containerStyles.layout === "row"
            ? "row"
            : containerStyles.layout === "column"
              ? "column"
              : undefined,
        gap: containerStyles.gap,
      }}
    >
      {elements.map((el) => (
        <RenderElement
          key={el.id}
          el={el}
          selectedId={selectedId}
          selectedIds={selectedIds}
          toggleSelect={toggleSelect}
          selectOnly={selectOnly}
          dnd={dnd}
          containerLayout={containerStyles.layout}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}
