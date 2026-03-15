"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ExplorerSection } from "@/components/ExplorerSection";
import { TreeItem } from "@/components/TreeItem";
import { CanvasArea } from "@/components/CanvasArea";
import { PropertiesPanel } from "@/components/PropertiesPanel";
import { useEditor } from "@/hooks/useEditor";
import { useElementSize } from "@/hooks/useElementSize";
import { clampInt } from "@/lib/math";
import { buildHtml } from "@/lib/export";
import { PresetName } from "@/lib/presets";
import { IsolatedPreview } from "@/components/IsolatedPreview";

export function Home() {
  const {
    breakpoints,
    setBreakpoints,
    activeId,
    setActiveId,
    active,
    elements,
    setElements,
    selectedIds,
    selectOnly,
    toggleSelect,
    containerStyles,
    addElement,
    addElementAt,
    addPresetAt,
    deleteSelected,
    duplicateSelected,
    moveElement,
    // Pages
    pages,
    activePageId,
    activePage,
    setActivePageId,
    addPage,
    removePage,
    updatePageName,
    updatePageLayout,
  } = useEditor();

  // Rename state
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("layers");

  // Effect to switch tab when selection changes
  React.useEffect(() => {
    // If we have selected items, or we clicked the background (selectedIds is empty),
    // we want to show properties.
    // However, if we just want to see layers, we shouldn't force switch?
    // User asked: "When selecting a page, the right side should be page settings. Currently it stays at Components."
    // Actually, the Right Sidebar is NOT the one with Tabs "Layers/Element/Comp".
    // That is the LEFT sidebar.
    // The Right Sidebar is PropertiesPanel.
    // Let's re-read the user request.
    // "When clicking select page, make right side be page settings. Now it stays at Components"
    // Wait, "Components" is a section in the LEFT sidebar.
    // Did the user mean the Left Sidebar? Or is there a confusion?
    
    // Ah, in the code, the Left Sidebar has Tabs: "layers", "element", "component".
    // "layers" tab has "Pages" and "Components" (tree view).
    // "element" tab has "Layout" (drag buttons for Box, Text, etc).
    
    // If the user means "Right Sidebar", PropertiesPanel handles it.
    // If the user means "Left Sidebar", maybe they want to switch to "element" tab when adding stuff?
    // But the request says "Right side".
    
    // Let's assume the user means "When I click the page background, I want to see Page Settings in the Right Panel".
    // I already implemented that in the previous turn.
    // "Now it stays at Components" -> This might mean "It shows 'Select an element to edit' or something else".
    // OR, maybe the user thinks the Left Sidebar is the "Right Side"? Unlikely.
    
    // Let's look at the previous turn. I added Page Settings to PropertiesPanel when selectedIds.length === 0.
    // So if I click background, selectedIds becomes [], and PropertiesPanel shows Page Settings.
    
    // "Currently it stays at Components"
    // Maybe the user means the "Components" section in the Layers tab?
    // Or maybe the user is referring to the text "Select an element to edit" which I replaced?
    
    // Let's consider if "Components" refers to the "ExplorerSection title='Components'" in the Left Sidebar.
    // If the user clicks the page background, maybe they want the Left Sidebar to switch? No, that's for adding elements.
    
    // WAIT. "Components" might be the title of the Properties Panel when an element is selected?
    // No, PropertiesPanel titles are "Identity", "Layout", etc.
    
    // Let's assume the user is talking about the **Left Sidebar** Tabs.
    // "Layers" tab shows the tree.
    // "Element" tab shows draggable components (Box, Text, etc).
    // If the user clicks the page, they might expect to see "Page Settings" in the *Right* panel (which I did).
    
    // Maybe the user meant: "When I select a page (by clicking its name in the Layers list on the left), show Page Settings on the right".
    // In `ExplorerSection title="Pages"`, clicking a page sets `activePageId`.
    // It does NOT clear `selectedIds`.
    // If `selectedIds` is not empty, PropertiesPanel shows the selected element properties.
    // So if I have an element selected, and I switch pages via the list, the element is still selected (if it exists in new page? No, elements are global in this app structure? No, elements belong to `activePageId` usually?
    // Let's check `useEditor`.
    // `elements` state seems global in `useEditor` currently? 
    // `const [elements, setElements] = React.useState<ElementNode[]>([]);`
    // It doesn't seem filtered by page yet? 
    // Wait, `activePage` is just metadata. `elements` are... shared?
    // If so, clicking a page in the list just changes `activePageId`.
    // If I have an element selected, `selectedIds` is `['some-id']`.
    // PropertiesPanel sees `selectedIds.length > 0` and shows element props.
    // The user wants to see Page Settings when they click the Page name.
    
    // FIX: When switching pages (setActivePageId), we should probably clear the selection.
  }, []);

  const startRename = (id: string, name: string) => {
    setRenamingId(id);
    setRenameValue(name);
  };

  const handleRename = () => {
    if (renamingId) {
      updatePageName(renamingId, renameValue);
      setRenamingId(null);
    }
  };

  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
  const selected = React.useMemo(
    () => elements.find((e) => e.id === selectedId) ?? null,
    [elements, selectedId],
  );

  const GRID = 8;
  const snap = React.useCallback(
    (n: number) => Math.round(n / GRID) * GRID,
    [],
  );

  // Breakpoints dialog edit state (local draft)
  const [draft, setDraft] = React.useState(breakpoints);
  React.useEffect(() => setDraft(breakpoints), [breakpoints]);

  // Canvas fit scaling
  const { ref: canvasRef, size: canvasSize } = useElementSize<HTMLDivElement>();
  const [zoomLevel, setZoomLevel] = React.useState<number | null>(null);
  const zoomPadding = 64; // p-6-ish safe space

  const scale = React.useMemo(() => {
    if (zoomLevel !== null) return zoomLevel;

    const cw = Math.max(0, canvasSize.width - zoomPadding * 2);
    const ch = Math.max(0, canvasSize.height - zoomPadding * 2);
    const zoom = 0.92; // editor-like default

    if (!cw || !ch) return zoom;

    const sx = cw / active.width;
    const sy = ch / active.height;
    // For auto-fit, we don't use height constraint if we want scrolling?
    // User asked for "scrolling to see overflow".
    // If we fit to height, it shrinks too much for long pages.
    // Usually "Fit" means "Fit Width" for web builders.
    
    // Let's fit width primarily, but maybe limit if height is too small?
    // Actually, for "Fit", we usually want to see the whole page if it's a fixed viewport design.
    // But since we enabled scrolling, maybe "Fit Width" is better?
    // Let's stick to "Fit Contain" for now as default, but allow manual zoom.
    
    const fit = Math.min(sx, 1); // Fit width, don't upscale
    // const fit = Math.min(sx, sy, 1); // Old logic
    
    return Math.max(0.1, fit * zoom);
  }, [canvasSize.width, canvasSize.height, active.width, active.height, zoomLevel]);

  const handlePresetClick = (preset: PresetName) => {
    // Determine target layout (active page layout or fallback)
    const pageLayout = pages.find((p) => p.id === activePageId)?.layout || "column";
    
    if (pageLayout === "stack") {
      addPresetAt(preset, active.width / 2, active.height / 2);
    } else {
      addPresetAt(preset, 0, 0);
    }
  };

  const [previewOpen, setPreviewOpen] = React.useState(false);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete
      if (e.key === "Delete" || e.key === "Backspace") {
        // Avoid deleting when editing text
        if (
          document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA"
        ) {
          return;
        }
        deleteSelected();
      }
      // Duplicate (Ctrl+D)
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        duplicateSelected();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteSelected, duplicateSelected]);

  return (
    <div className="h-screen w-full overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="flex h-12 items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-md border border-zinc-800">
              <Button variant="ghost" className="h-8 rounded-none px-3 text-xs">
                Designer
              </Button>
              <Separator orientation="vertical" className="h-8 bg-zinc-800" />
              <Button variant="ghost" className="h-8 rounded-none px-3 text-xs">
                Developer
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6 bg-zinc-800" />

            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Buddy Cove</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 px-2 text-xs text-zinc-300"
                  >
                    ▾
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="border-zinc-800 bg-zinc-950 text-zinc-100"
                >
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Team</DropdownMenuItem>
                  <DropdownMenuItem>Export</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-zinc-800 text-zinc-300">
              Public
            </Badge>
            <Button
              variant="outline"
              className="h-8 border-zinc-800 bg-transparent text-xs hover:bg-zinc-900"
            >
              Share
            </Button>
            <Button
              variant="outline"
              className="h-8 border-zinc-800 bg-transparent text-xs hover:bg-zinc-900"
            >
              {"</>"} Code
            </Button>
            <Button className="h-8 text-xs">Publish</Button>
            <Button variant="destructive" className="h-8 text-xs">
              Upgrade
            </Button>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <ResizablePanelGroup
        orientation="horizontal"
        className="h-[calc(100dvh-48px)]! w-full min-w-0"
      >
        {/* Left sidebar */}
        <ResizablePanel
          defaultSize="18%"
          minSize="14%"
          maxSize="28%"
          className="border-r border-zinc-800 min-w-0"
        >
          <div className="flex h-full min-h-0 flex-col bg-zinc-950">
            <Tabs defaultValue="layers" className="flex h-full flex-col">
              <div className="px-2 py-2 border-b border-zinc-800">
                <TabsList className="grid w-full grid-cols-3 bg-zinc-900 h-8">
                  <TabsTrigger value="layers" className="text-[10px] h-6 px-1">Layers</TabsTrigger>
                  <TabsTrigger value="element" className="text-[10px] h-6 px-1">Element</TabsTrigger>
                  <TabsTrigger value="component" className="text-[10px] h-6 px-1">Comp.</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="layers" className="flex-1 min-h-0 flex flex-col mt-0 data-[state=inactive]:hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
                  <div className="text-sm font-semibold">Layers</div>
                  <Input
                    placeholder="Search"
                    className="h-7 w-[100px] border-zinc-800 bg-zinc-900/60 text-[10px] placeholder:text-zinc-500"
                  />
                </div>
                <ScrollArea className="flex-1 min-h-0">
                  <div className="p-2">
                    <ExplorerSection title="Pages" onAdd={addPage}>
                      {pages.map((page) => (
                        <div
                          key={page.id}
                          className={[
                            "group flex cursor-pointer items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-zinc-900",
                            activePageId === page.id
                              ? "bg-zinc-900 text-zinc-100 font-medium"
                              : "text-zinc-400",
                          ].join(" ")}
                          onClick={() => {
                            setActivePageId(page.id);
                            selectOnly(null); // Deselect elements to show page settings
                          }}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-[10px] opacity-50">📄</span>
                            <span className="truncate text-xs">{page.name}</span>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-6 w-6 p-0 text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-zinc-300 data-[state=open]:opacity-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                ⋮
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-32 border-zinc-800 bg-zinc-950 text-zinc-100"
                            >
                              <DropdownMenuItem
                                onClick={() => startRename(page.id, page.name)}
                                className="text-xs"
                              >
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-xs text-red-400 focus:text-red-300"
                                onClick={() => removePage(page.id)}
                                disabled={pages.length <= 1}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </ExplorerSection>

                    <ExplorerSection title="Components">
                      {elements.length === 0 ? (
                        <div className="text-xs text-zinc-500 px-2 py-2">
                          ไม่มี element ในแคนวาส
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          {(() => {
                            const renderTree = (node: typeof elements[0], depth: number): React.ReactNode => (
                              <TreeItem
                                key={node.id}
                                label={node.label}
                                active={selectedIds.includes(node.id)}
                                depth={depth}
                                onClick={(e) => {
                                  if (e.ctrlKey || e.shiftKey) {
                                    toggleSelect(node.id);
                                  } else {
                                    selectOnly(node.id);
                                  }
                                }}
                              >
                                {node.children && node.children.length > 0
                                  ? node.children.map((child) => renderTree(child, depth + 1))
                                  : null}
                              </TreeItem>
                            );
                            return elements.map((el) => renderTree(el, 0));
                          })()}
                        </div>
                      )}
                    </ExplorerSection>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="element" className="flex-1 min-h-0 flex flex-col mt-0 data-[state=inactive]:hidden">
                <ScrollArea className="flex-1 min-h-0">
                  <div className="p-2 space-y-4">
                    <ExplorerSection title="Layout">
                      <div className="grid grid-cols-2 gap-2 px-2">
                        <Button
                          variant="outline"
                          className="h-8 text-xs border-zinc-800 justify-start"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/element-type", "box");
                            e.dataTransfer.effectAllowed = "copy";
                          }}
                          onClick={() => addElement("box")}
                        >
                          Box
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 text-xs border-zinc-800 justify-start"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/element-type", "row");
                            e.dataTransfer.effectAllowed = "copy";
                          }}
                          onClick={() => addElement("row")}
                        >
                          Row
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 text-xs border-zinc-800 justify-start"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/element-type", "column");
                            e.dataTransfer.effectAllowed = "copy";
                          }}
                          onClick={() => addElement("column")}
                        >
                          Column
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 text-xs border-zinc-800 justify-start"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/element-type", "grid");
                            e.dataTransfer.effectAllowed = "copy";
                          }}
                          onClick={() => addElement("grid")}
                        >
                          Grid
                        </Button>
                      </div>
                    </ExplorerSection>
                    <ExplorerSection title="Typography">
                      <div className="grid grid-cols-2 gap-2 px-2">
                        <Button
                          variant="outline"
                          className="h-8 text-xs border-zinc-800 justify-start"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/element-type", "text");
                            e.dataTransfer.effectAllowed = "copy";
                          }}
                          onClick={() => addElement("text")}
                        >
                          Text
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 text-xs border-zinc-800 justify-start"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/element-type", "heading");
                            e.dataTransfer.effectAllowed = "copy";
                          }}
                          onClick={() => addElement("heading")}
                        >
                          Heading
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 text-xs border-zinc-800 justify-start"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/element-type", "link");
                            e.dataTransfer.effectAllowed = "copy";
                          }}
                          onClick={() => addElement("link")}
                        >
                          Link
                        </Button>
                      </div>
                    </ExplorerSection>
                    <ExplorerSection title="Media">
                      <div className="grid grid-cols-2 gap-2 px-2">
                        <Button
                          variant="outline"
                          className="h-8 text-xs border-zinc-800 justify-start"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/element-type", "image");
                            e.dataTransfer.effectAllowed = "copy";
                          }}
                          onClick={() => addElement("image")}
                        >
                          Image
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 text-xs border-zinc-800 justify-start"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/element-type", "video");
                            e.dataTransfer.effectAllowed = "copy";
                          }}
                          onClick={() => addElement("video")}
                        >
                          Video
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 text-xs border-zinc-800 justify-start"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/element-type", "iframe");
                            e.dataTransfer.effectAllowed = "copy";
                          }}
                          onClick={() => addElement("iframe")}
                        >
                          Iframe
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 text-xs border-zinc-800 justify-start"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/element-type", "code");
                            e.dataTransfer.effectAllowed = "copy";
                          }}
                          onClick={() => addElement("code")}
                        >
                          Code Embed
                        </Button>
                      </div>
                    </ExplorerSection>
                    <ExplorerSection title="Forms">
                      <div className="grid grid-cols-2 gap-2 px-2">
                        <Button
                          variant="outline"
                          className="h-8 text-xs border-zinc-800 justify-start"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/element-type", "button");
                            e.dataTransfer.effectAllowed = "copy";
                          }}
                          onClick={() => addElement("button")}
                        >
                          Button
                        </Button>
                      </div>
                    </ExplorerSection>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="component" className="flex-1 min-h-0 flex flex-col mt-0 data-[state=inactive]:hidden">
                <ScrollArea className="flex-1 min-h-0">
                  <div className="p-2">
                    <ExplorerSection title="UI Kits">
                      <div className="grid grid-cols-2 gap-2 px-2">
                        <Button
                          variant="outline"
                          className="h-8 text-xs border-zinc-800 justify-start"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/preset", "hero");
                            e.dataTransfer.effectAllowed = "copy";
                          }}
                          onClick={() => handlePresetClick("hero")}
                        >
                          Hero
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 text-xs border-zinc-800 justify-start"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/preset", "navbar");
                            e.dataTransfer.effectAllowed = "copy";
                          }}
                          onClick={() => handlePresetClick("navbar")}
                        >
                          Navbar
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 text-xs border-zinc-800 justify-start"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/preset", "cta");
                            e.dataTransfer.effectAllowed = "copy";
                          }}
                          onClick={() => handlePresetClick("cta")}
                        >
                          CTA
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 text-xs border-zinc-800 justify-start"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/preset", "card");
                            e.dataTransfer.effectAllowed = "copy";
                          }}
                          onClick={() => handlePresetClick("card")}
                        >
                          Card
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 text-xs border-zinc-800 justify-start"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/preset", "avatar-row");
                            e.dataTransfer.effectAllowed = "copy";
                          }}
                          onClick={() => handlePresetClick("avatar-row")}
                        >
                          Avatar Row
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 text-xs border-zinc-800 justify-start"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/preset", "login-form");
                            e.dataTransfer.effectAllowed = "copy";
                          }}
                          onClick={() => handlePresetClick("login-form")}
                        >
                          Login Form
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 text-xs border-zinc-800 justify-start"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/preset", "pricing-table");
                            e.dataTransfer.effectAllowed = "copy";
                          }}
                          onClick={() => handlePresetClick("pricing-table")}
                        >
                          Pricing
                        </Button>
                      </div>
                    </ExplorerSection>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>

        <ResizableHandle className="bg-zinc-800" />

        {/* Center canvas */}
        <ResizablePanel
          defaultSize="64%"
          minSize="45%"
          className="bg-zinc-950 min-w-0"
        >
          <div className="flex h-full min-h-0 min-w-0 flex-col">
            {/* center top bar */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <Badge
                  variant="secondary"
                  className="bg-zinc-900 text-xs text-zinc-200"
                >
                  Thai
                </Badge>
                <div className="truncate text-xs text-zinc-500">
                  Home / Main / ComponentMatch / Test
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Breakpoint dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-8 border-zinc-800 bg-transparent text-xs hover:bg-zinc-900"
                    >
                      {active.name}: {active.width}px ▾
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 border-zinc-800 bg-zinc-950 text-zinc-100"
                  >
                    <DropdownMenuLabel className="text-xs text-zinc-400">
                      Breakpoints
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    {breakpoints
                      .filter((b) => b.id !== "custom")
                      .map((b) => (
                        <DropdownMenuItem
                          key={b.id}
                          onClick={() => setActiveId(b.id)}
                          className="text-xs"
                        >
                          <span className="flex-1">{b.name}</span>
                          <span className="text-zinc-400">{b.width}px</span>
                        </DropdownMenuItem>
                      ))}
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem
                      onClick={() => setActiveId("custom")}
                      className="text-xs"
                    >
                      <span className="flex-1">Custom</span>
                      <span className="text-zinc-400">
                        {breakpoints.find((x) => x.id === "custom")?.width ??
                          1024}
                        px
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Breakpoints settings */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-8 border-zinc-800 bg-transparent text-xs hover:bg-zinc-900"
                    >
                      Breakpoints
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-2xl border-zinc-800 bg-zinc-950 text-zinc-100">
                    <DialogHeader>
                      <DialogTitle className="text-base">
                        Breakpoints Settings
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3">
                      <div className="text-xs text-zinc-400">
                        ปรับชื่อ/ขนาด แล้วกด Save เพื่อใช้งานกับ dropdown ด้านบน
                      </div>

                      <div className="grid grid-cols-12 gap-2 text-xs text-zinc-400">
                        <div className="col-span-4 px-2">Name</div>
                        <div className="col-span-3 px-2">Width</div>
                        <div className="col-span-3 px-2">Height</div>
                        <div className="col-span-2 px-2 text-right">
                          Actions
                        </div>
                      </div>

                      <div className="max-h-[45vh] overflow-auto rounded-md border border-zinc-800">
                        <div className="divide-y divide-zinc-800">
                          {draft.map((b, idx) => (
                            <div
                              key={b.id}
                              className="grid grid-cols-12 items-center gap-2 p-2"
                            >
                              <div className="col-span-4">
                                <Input
                                  value={b.name}
                                  onChange={(e) =>
                                    setDraft((prev) =>
                                      prev.map((x, i) =>
                                        i === idx
                                          ? { ...x, name: e.target.value }
                                          : x,
                                      ),
                                    )
                                  }
                                  className="h-8 border-zinc-800 bg-zinc-900/60 text-xs"
                                />
                              </div>
                              <div className="col-span-3">
                                <Input
                                  type="number"
                                  value={b.width}
                                  onChange={(e) =>
                                    setDraft((prev) =>
                                      prev.map((x, i) =>
                                        i === idx
                                          ? {
                                              ...x,
                                              width: clampInt(
                                                e.target.value,
                                                200,
                                                8000,
                                              ),
                                            }
                                          : x,
                                      ),
                                    )
                                  }
                                  className="h-8 border-zinc-800 bg-zinc-900/60 text-xs"
                                />
                              </div>
                              <div className="col-span-3">
                                <Input
                                  type="number"
                                  value={b.height}
                                  onChange={(e) =>
                                    setDraft((prev) =>
                                      prev.map((x, i) =>
                                        i === idx
                                          ? {
                                              ...x,
                                              height: clampInt(
                                                e.target.value,
                                                200,
                                                8000,
                                              ),
                                            }
                                          : x,
                                      ),
                                    )
                                  }
                                  className="h-8 border-zinc-800 bg-zinc-900/60 text-xs"
                                />
                              </div>
                              <div className="col-span-2 flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  className="h-8 border-zinc-800 bg-transparent px-2 text-xs hover:bg-zinc-900"
                                  onClick={() => setActiveId(b.id)}
                                >
                                  Use
                                </Button>
                                <Button
                                  variant="destructive"
                                  className="h-8 px-2 text-xs"
                                  onClick={() =>
                                    setDraft((prev) =>
                                      prev.filter((x) => x.id !== b.id),
                                    )
                                  }
                                  disabled={
                                    // ป้องกันลบ default หลัก ๆ ให้เหลืออย่างน้อย 1
                                    b.id === "desktop" ||
                                    b.id === "tablet" ||
                                    b.id === "mobile"
                                  }
                                >
                                  Del
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Button
                          variant="secondary"
                          className="h-8 bg-zinc-900 text-xs hover:bg-zinc-800"
                          onClick={() =>
                            setDraft((prev) => [
                              ...prev,
                              {
                                id: crypto.randomUUID(),
                                name: "New",
                                width: 1024,
                                height: 768,
                              },
                            ])
                          }
                        >
                          + Add breakpoint
                        </Button>

                        <div className="text-xs text-zinc-500">
                          Active:{" "}
                          <span className="text-zinc-200">
                            {active.name} ({active.width}×{active.height})
                          </span>
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        className="border-zinc-800 bg-transparent text-xs hover:bg-zinc-900"
                        onClick={() => setDraft(breakpoints)}
                      >
                        Reset
                      </Button>
                      <Button
                        className="text-xs"
                        onClick={() => {
                          setBreakpoints(draft);
                          // ถ้า activeId ถูกลบ ให้ fallback
                          if (!draft.some((x) => x.id === activeId)) {
                            setActiveId(draft[0]?.id ?? "tablet");
                          }
                        }}
                      >
                        Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  className="h-8 border-zinc-800 bg-transparent text-xs hover:bg-zinc-900"
                >
                  Page Setup
                </Button>
                <Button className="h-8 text-xs">✨ AI Assistant</Button>
              </div>
            </div>

            {/* canvas */}
            <div
              ref={canvasRef}
              className="relative flex-1 min-h-0 overflow-auto" // changed overflow-hidden to overflow-auto
              onClick={(e) => {
                // Click on background deselects
                if (e.target === e.currentTarget) {
                  selectOnly(null);
                }
              }}
            >
              <div className="absolute inset-0 min-h-full min-w-full bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />
              <div className="absolute inset-0 min-h-full min-w-full bg-gradient-to-b from-transparent via-transparent to-black/40 pointer-events-none" />

              <div className="min-h-full w-full flex items-start justify-center p-20 pointer-events-none">
                <div
                  className="origin-top transition-transform pointer-events-auto"
                  style={{ transform: `scale(${scale})` }}
                >
                  <div
                    className="relative rounded-md border border-zinc-800 bg-white"
                    style={{ 
                      width: active.width, 
                      minHeight: active.height, // Use minHeight instead of height
                      height: "auto",
                      backgroundColor: activePage.backgroundColor || "white"
                    }}
                    onClick={(e) => {
                      // If clicking exactly on the container background, deselect
                      if (e.target === e.currentTarget) {
                        selectOnly(null);
                      }
                    }}
                  >
                    {/* labels */}
                    <div className="absolute -left-10 top-10 rotate-[-90deg] text-xs text-amber-300">
                      {active.name}: {active.width}px
                    </div>
                    <div className="absolute -right-10 top-10 text-xs text-amber-300">
                      {active.width}px
                    </div>

                    <div
                      className="absolute inset-0 rounded-md pointer-events-none"
                      style={{
                        boxShadow:
                          "0 0 0 1px rgba(255,255,255,0.05), 0 30px 120px rgba(0,0,0,0.6)",
                      }}
                    />

                    {/* bottom toolbar mock */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-auto z-50">
                      <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/90 px-3 py-2 shadow">
                        <span className="text-xs text-zinc-600">
                          14.9k tokens
                        </span>
                        <Separator
                          orientation="vertical"
                          className="h-4 bg-zinc-200"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            // Store current state to local storage to be picked up by preview page
                            const state = {
                              pages,
                              activePageId,
                              containerStyles
                            };
                            localStorage.setItem("ui-builder:preview-state", JSON.stringify(state));
                            window.open("/preview", "_blank");
                          }}
                        >
                          Preview
                        </Button>
                      </div>
                    </div>
                    <CanvasArea
                      elements={elements}
                      selectedId={selectedId}
                      selectedIds={selectedIds}
                      containerStyles={{
                        layout: activePage.layout || "column",
                        gap: activePage.gap || 0,
                      }}
                      active={active}
                      scale={scale}
                      snap={snap}
                      selected={selected}
                      addElement={addElement}
                      addElementAt={addElementAt}
                      addPresetAt={addPresetAt}
                      setElements={setElements}
                      toggleSelect={toggleSelect}
                      selectOnly={selectOnly}
                      moveElement={moveElement}
                    />
                  </div>
                </div>

                  <div className="absolute bottom-3 right-3 rounded-md border border-zinc-800 bg-zinc-950/70 p-1 text-[11px] text-zinc-400 backdrop-blur pointer-events-auto flex items-center gap-1 z-50">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 rounded-sm hover:bg-zinc-800 text-zinc-300"
                      onClick={() => {
                        setZoomLevel(Math.max(0.1, scale - 0.1));
                      }}
                    >
                      -
                    </Button>
                    <span 
                      className="min-w-[3ch] text-center cursor-pointer hover:text-white" 
                      onClick={() => setZoomLevel(1)}
                      title="Reset to 100%"
                    >
                      {Math.round(scale * 100)}%
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 rounded-sm hover:bg-zinc-800 text-zinc-300"
                      onClick={() => {
                        setZoomLevel(Math.min(2, scale + 0.1));
                      }}
                    >
                      +
                    </Button>
                  </div>
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle className="bg-zinc-800" />

        <ResizablePanel
          defaultSize="18%"
          minSize="14%"
          maxSize="28%"
          className="border-l border-zinc-800 min-w-0"
        >
          <PropertiesPanel
            elements={elements}
            selectedIds={selectedIds}
            setElements={setElements}
            // Page Properties
            activePageId={activePageId}
            activePage={activePage}
            updatePageLayout={updatePageLayout}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[90vw] w-full h-[90vh] border-zinc-800 bg-zinc-950 p-0 overflow-hidden">
          <div className="h-full w-full bg-white relative">
            <IsolatedPreview
              html={buildHtml(elements, containerStyles, active)}
              js=""
            />
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!renamingId} onOpenChange={(open) => !open && setRenamingId(null)}>
        <DialogContent className="sm:max-w-[425px] border-zinc-800 bg-zinc-950 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Rename Page</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              id="name"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="col-span-3 border-zinc-800 bg-zinc-900 text-zinc-100"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenamingId(null)}
              className="border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-900"
            >
              Cancel
            </Button>
            <Button onClick={handleRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
