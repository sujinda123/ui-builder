import * as React from "react";
import { Breakpoint, ElementNode, ElementType, Page } from "@/lib/types";
import { buildPreset, PresetName } from "@/lib/presets";
import { clampNum } from "@/lib/math";

const DEFAULT_BREAKPOINTS: Breakpoint[] = [
  { id: "desktop", name: "Desktop", width: 1440, height: 900 },
  { id: "tablet", name: "Tablet", width: 991, height: 780 },
  { id: "mobile", name: "Mobile", width: 390, height: 844 },
  { id: "custom", name: "Custom", width: 1024, height: 768 },
];

export function useEditor() {
  // Breakpoints
  const [breakpoints, setBreakpoints] =
    React.useState<Breakpoint[]>(DEFAULT_BREAKPOINTS);
  const [activeId, setActiveId] = React.useState("tablet");
  const active = React.useMemo(
    () => breakpoints.find((b) => b.id === activeId) ?? breakpoints[1],
    [breakpoints, activeId],
  );

  // Editor State
  // Pages
  const [pages, setPages] = React.useState<Page[]>([
    { id: "home", name: "Home", elements: [] },
  ]);
  const [activePageId, setActivePageId] = React.useState("home");

  // Derived active page elements
  const activePage = React.useMemo(
    () => pages.find((p) => p.id === activePageId) ?? pages[0],
    [pages, activePageId],
  );
  const elements = activePage.elements;

  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [containerStyles, setContainerStyles] = React.useState<{
    gap: number;
    layout: "row" | "column" | "stack";
  }>({ gap: 0, layout: "column" });

  // Load state
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("ui-builder:state");
      if (!raw) return;
      const data = JSON.parse(raw);
      
      if (Array.isArray(data.pages) && data.pages.length > 0) {
        setPages(data.pages);
        if (data.activePageId) setActivePageId(data.activePageId);
      } else if (Array.isArray(data.elements)) {
        // Migration from old format
        setPages([{ id: "home", name: "Home", elements: data.elements }]);
        setActivePageId("home");
      }

      if (data.containerStyles) setContainerStyles(data.containerStyles);
    } catch {}
  }, []);

  // Save state
  React.useEffect(() => {
    const data = JSON.stringify({ pages, activePageId, containerStyles });
    localStorage.setItem("ui-builder:state", data);
  }, [pages, activePageId, containerStyles]);

  // Page Actions
  const addPage = React.useCallback(() => {
    const newId = crypto.randomUUID();
    const newPage: Page = {
      id: newId,
      name: "New Page",
      elements: [],
      layout: "column", // Default layout
      gap: 0,
      padding: 0,
    };
    setPages((prev) => [...prev, newPage]);
    setActivePageId(newId);
    setSelectedIds([]);
  }, []);

  const deletePage = React.useCallback((id: string) => {
    if (pages.length <= 1) return;
    const newPages = pages.filter((p) => p.id !== id);
    setPages(newPages);
    if (id === activePageId) {
      setActivePageId(newPages[0].id);
      setSelectedIds([]);
    }
  }, [pages, activePageId]);

  const updatePageName = React.useCallback((id: string, name: string) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  }, []);

  // Element actions wrapper
  const setElements = React.useCallback(
    (value: ElementNode[] | ((prev: ElementNode[]) => ElementNode[])) => {
      setPages((prevPages) =>
        prevPages.map((p) => {
          if (p.id === activePageId) {
            const newElements =
              typeof value === "function" ? value(p.elements) : value;
            return { ...p, elements: newElements };
          }
          return p;
        }),
      );
    },
    [activePageId],
  );

  // Selection helpers
  const selectOnly = React.useCallback((id: string | null) => {
    setSelectedIds(id ? [id] : []);
  }, []);

  const toggleSelect = React.useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const createBaseElement = (type: ElementType): ElementNode => {
    const id = crypto.randomUUID();
    const base: ElementNode = {
      id,
      type,
      tag: "div",
      label: type.charAt(0).toUpperCase() + type.slice(1),
      styles: {
        width: 200,
        height: 120,
        backgroundColor: "#0b0f19",
        color: "#e5e7eb",
      },
      children: [],
    };

    switch (type) {
      case "text":
        return {
          ...base,
          label: "Text",
          text: "Text block",
          styles: {
            ...base.styles,
            height: 40,
            backgroundColor: "transparent",
            color: "#111827",
          },
        };
      case "heading":
        return {
          ...base,
          tag: "h1",
          label: "Heading",
          text: "Heading",
          styles: {
            ...base.styles,
            height: 40,
            backgroundColor: "transparent",
            color: "#111827",
            fontSize: 24,
            fontWeight: "bold",
          },
        };
      case "button":
        return {
          ...base,
          tag: "button",
          label: "Button",
          text: "Button",
          styles: {
            ...base.styles,
            height: 40,
            backgroundColor: "#2563eb",
            color: "#ffffff",
          },
        };
      case "image":
        return {
          ...base,
          tag: "img",
          label: "Image",
          src: "https://picsum.photos/320/180",
          styles: {
            ...base.styles,
            width: 320,
            height: 180,
            backgroundColor: "transparent",
          },
        };
      case "box":
        return {
          ...base,
          label: "Box",
          styles: {
            ...base.styles,
            width: 200,
            height: 200,
            backgroundColor: "#ffffff",
            border: "1px solid #e4e4e7",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            padding: "16px",
            overflow: "hidden", // Prevent overflow issues
          },
        };
      case "row":
        return {
          ...base,
          label: "Row",
          styles: {
            ...base.styles,
            width: 400,
            height: 100,
            backgroundColor: "transparent",
            border: "1px dashed #3f3f46",
            display: "flex",
            flexDirection: "row",
            gap: "8px",
            alignItems: "center",
          },
        };
      case "column":
        return {
          ...base,
          label: "Column",
          styles: {
            ...base.styles,
            width: 200,
            height: 300,
            backgroundColor: "transparent",
            border: "1px dashed #3f3f46",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          },
        };
      case "grid":
        return {
          ...base,
          label: "Grid",
          styles: {
            ...base.styles,
            width: 400,
            height: 300,
            backgroundColor: "transparent",
            border: "1px dashed #3f3f46",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
          },
        };
      case "link":
        return {
          ...base,
          tag: "a",
          label: "Link",
          text: "Link text",
          href: "#",
          styles: {
            ...base.styles,
            height: 24,
            width: 100,
            backgroundColor: "transparent",
            color: "#2563eb",
            textDecoration: "underline",
          } as any, // Cast to any to allow textDecoration if added to types later, or just standard CSS
        };
      case "video":
        return {
          ...base,
          tag: "video",
          label: "Video",
          src: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          styles: {
            ...base.styles,
            width: 320,
            height: 180,
            backgroundColor: "#000",
          },
        };
      case "iframe":
        return {
          ...base,
          tag: "iframe",
          label: "Iframe",
          src: "https://example.com",
          styles: {
            ...base.styles,
            width: 400,
            height: 300,
            backgroundColor: "#fff",
          },
        };
      case "code":
        return {
          ...base,
          tag: "code",
          label: "Code Embed",
          code: "<div>Custom HTML</div>",
          styles: {
            ...base.styles,
            width: 300,
            height: 100,
            backgroundColor: "#1e1e1e",
            color: "#d4d4d4",
            padding: "8px",
            fontSize: 12,
          },
        };
      default:
        return base;
    }
  };

  // Helper to find and update nested elements
  const addElementRecursive = (
    elements: ElementNode[],
    parentId: string,
    newElement: ElementNode
  ): ElementNode[] => {
    return elements.map((el) => {
      if (el.id === parentId) {
        return {
          ...el,
          children: [...(el.children || []), newElement],
        };
      }
      if (el.children && el.children.length > 0) {
        return {
          ...el,
          children: addElementRecursive(el.children, parentId, newElement),
        };
      }
      return el;
    });
  };

  // Element actions
  const addElement = React.useCallback(
    (type: ElementType, parentId?: string) => {
      const e = createBaseElement(type);
      
      setElements((prev) => {
        if (parentId) {
          return addElementRecursive(prev, parentId, e);
        }
        return [...prev, e];
      });
      setSelectedIds([e.id]);
    },
    [setElements],
  );

  const addElementAt = React.useCallback(
    (type: ElementType, x: number, y: number, parentId?: string) => {
      const e = createBaseElement(type);
      
      // Adjust position
      e.styles.left = clampNum(x - (Number(e.styles.width) / 2), 0, active.width);
      e.styles.top = clampNum(y - (Number(e.styles.height) / 2), 0, active.height);

      setElements((prev) => {
         if (parentId) {
           // If adding to parent, coordinates should be relative to parent if parent is relative
           // For simplicity in this iteration, we keep absolute for stack layout
           return addElementRecursive(prev, parentId, e);
         }
         return [...prev, e];
      });
      setSelectedIds([e.id]);
    },
    [active.width, active.height, setElements],
  );

  const addPresetAt = React.useCallback(
    (preset: PresetName, x: number, y: number) => {
      const els = buildPreset(preset, x, y, active);
      if (els.length) {
        setElements((prev) => [...prev, ...els]);
        setSelectedIds([els[0].id]); // Select the first one
      }
    },
    [active, setElements],
  );

  const duplicateSelected = React.useCallback(() => {
    if (selectedIds.length === 0) return;

    // Use current elements from closure
    const newElements: ElementNode[] = [];
    const newIds: string[] = [];

    const selectedEls = elements.filter((e) => selectedIds.includes(e.id));

    selectedEls.forEach((el) => {
      const copy: ElementNode = {
        ...el,
        id: crypto.randomUUID(),
        label: `${el.label} Copy`,
        styles: {
          ...el.styles,
          left: (Number(el.styles.left) ?? 0) + 20,
          top: (Number(el.styles.top) ?? 0) + 20,
        },
      };
      newElements.push(copy);
      newIds.push(copy.id);
    });

    if (newElements.length > 0) {
      setElements((prev) => [...prev, ...newElements]);
      setSelectedIds(newIds);
    }
  }, [elements, selectedIds, setElements]);

  // Recursive delete
  const deleteRecursive = (elements: ElementNode[], ids: string[]): ElementNode[] => {
    return elements
      .filter((el) => !ids.includes(el.id))
      .map((el) => ({
        ...el,
        children: el.children ? deleteRecursive(el.children, ids) : [],
      }));
  };

  const deleteSelected = React.useCallback(() => {
    setElements((prev) => deleteRecursive(prev, selectedIds));
    setSelectedIds([]);
  }, [selectedIds, setElements]);

  // Move Element
  const moveElement = React.useCallback((
    dragId: string, 
    targetParentId: string | null, 
    targetIndex?: number,
    updateStyles?: Partial<ElementNode["styles"]>
  ) => {
    setElements((prev) => {
      // 1. Find and clone the dragged element
      let draggedEl: ElementNode | null = null;
      
      const removeRecursive = (list: ElementNode[]): ElementNode[] => {
        const newList: ElementNode[] = [];
        for (const el of list) {
          if (el.id === dragId) {
            draggedEl = { 
              ...el,
              styles: updateStyles ? { ...el.styles, ...updateStyles } : el.styles
            };
            continue; // Skip adding it to newList (remove)
          }
          if (el.children) {
            newList.push({ ...el, children: removeRecursive(el.children) });
          } else {
            newList.push(el);
          }
        }
        return newList;
      };

      const elementsWithoutDrag = removeRecursive(prev);

      if (!draggedEl) return prev; // Not found

      // 2. Insert into target
      // If targetParentId is null, insert into root
      if (!targetParentId) {
         const newRoot = [...elementsWithoutDrag];
         if (typeof targetIndex === 'number' && targetIndex >= 0) {
            newRoot.splice(targetIndex, 0, draggedEl);
         } else {
            newRoot.push(draggedEl);
         }
         return newRoot;
      }

      // Insert into nested parent
      const addRecursive = (list: ElementNode[]): ElementNode[] => {
        return list.map(el => {
          if (el.id === targetParentId) {
             const newChildren = el.children ? [...el.children] : [];
             if (typeof targetIndex === 'number' && targetIndex >= 0) {
                newChildren.splice(targetIndex, 0, draggedEl!);
             } else {
                newChildren.push(draggedEl!);
             }
             return { ...el, children: newChildren };
          }
          if (el.children) {
            return { ...el, children: addRecursive(el.children) };
          }
          return el;
        });
      };

      return addRecursive(elementsWithoutDrag);
    });
  }, [setElements]);

  const updatePageLayout = React.useCallback(
    (
      id: string,
      props: {
        layout?: "row" | "column" | "stack";
        gap?: number;
        padding?: number;
        backgroundColor?: string;
      }
    ) => {
      setPages((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...props } : p))
      );
    },
    []
  );

  return {
    breakpoints,
    setBreakpoints,
    activeId,
    setActiveId,
    active,
    
    // Pages
    pages,
    activePageId,
    activePage,
    setActivePageId,
    addPage,
    removePage: deletePage,
    updatePageName,
    updatePageLayout,
    
    elements,
    setElements,
    selectedIds,
    setSelectedIds,
    selectOnly,
    toggleSelect,
    containerStyles,
    setContainerStyles,
    addElement,
    addElementAt,
    addPresetAt,
    deleteSelected,
    duplicateSelected,
    moveElement,
  };
}
