import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PanelBlock } from "@/components/PanelBlock";
import { Row } from "@/components/Row";
import { Input } from "@/components/ui/input";
import { ElementNode, Page } from "@/lib/types";
import { clampInt } from "@/lib/math";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { ColorPicker } from "@/components/ColorPicker";

interface PropertiesPanelProps {
  elements: ElementNode[];
  selectedIds: string[];
  setElements: React.Dispatch<React.SetStateAction<ElementNode[]>>;
  activePageId?: string;
  activePage?: Page;
  updatePageLayout?: (id: string, props: any) => void;
}

export function PropertiesPanel({
  elements,
  selectedIds,
  setElements,
  activePageId,
  activePage,
  updatePageLayout,
}: PropertiesPanelProps) {
  const selected = React.useMemo(() => {
    if (selectedIds.length !== 1) return null;
    
    // Recursive find
    const findRecursive = (list: ElementNode[]): ElementNode | null => {
      for (const el of list) {
        if (el.id === selectedIds[0]) return el;
        if (el.children) {
          const found = findRecursive(el.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findRecursive(elements);
  }, [elements, selectedIds]);

  if (selectedIds.length === 0) {
    if (activePage && updatePageLayout) {
      return (
        <div className="flex h-full min-h-0 flex-col">
          <div className="px-3 py-2 text-xs font-semibold text-zinc-400">
            Page Settings: {activePage.name}
          </div>
          <Separator className="bg-zinc-800" />
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-4 p-3">
              <PanelBlock title="Layout">
                <Row label="Type">
                  <Select
                    value={activePage.layout || "column"}
                    onValueChange={(val) =>
                      updatePageLayout(activePage.id, { layout: val })
                    }
                  >
                    <SelectTrigger className="h-8 border-zinc-800 bg-zinc-900/60 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="column">Column</SelectItem>
                      <SelectItem value="row">Row</SelectItem>
                      <SelectItem value="stack">Stack (Free)</SelectItem>
                    </SelectContent>
                  </Select>
                </Row>
                <Row label="Gap">
                  <Input
                    type="number"
                    className="h-8 border-zinc-800 bg-zinc-900/60 text-xs"
                    value={activePage.gap ?? 0}
                    onChange={(e) =>
                      updatePageLayout(activePage.id, { gap: parseInt(e.target.value) })
                    }
                  />
                </Row>
                <Row label="Padding">
                  <Input
                    type="number"
                    className="h-8 border-zinc-800 bg-zinc-900/60 text-xs"
                    value={activePage.padding ?? 0}
                    onChange={(e) =>
                      updatePageLayout(activePage.id, { padding: parseInt(e.target.value) })
                    }
                  />
                </Row>
              </PanelBlock>

              <PanelBlock title="Appearance">
                <Row label="Bg Color">
                  <ColorPicker
                    color={activePage.backgroundColor}
                    onChange={(c) => updatePageLayout(activePage.id, { backgroundColor: c })}
                  />
                </Row>
              </PanelBlock>
            </div>
          </ScrollArea>
        </div>
      );
    }
    return (
      <div className="flex h-full items-center justify-center text-xs text-zinc-500">
        Select an element to edit
      </div>
    );
  }

  if (selectedIds.length > 1) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-zinc-500">
        {selectedIds.length} elements selected
      </div>
    );
  }

  if (!selected) return null;

  const updateElement = <K extends keyof ElementNode>(
    key: K,
    value: ElementNode[K],
  ) => {
    // Recursive update
    const updateRecursive = (list: ElementNode[]): ElementNode[] => {
      return list.map((el) => {
        if (el.id === selected.id) {
          return { ...el, [key]: value };
        }
        if (el.children) {
          return { ...el, children: updateRecursive(el.children) };
        }
        return el;
      });
    };
    setElements((prev) => updateRecursive(prev));
  };

  const updateStyle = <K extends keyof ElementNode["styles"]>(
    key: K,
    value: ElementNode["styles"][K],
  ) => {
    // Recursive update
    const updateRecursive = (list: ElementNode[]): ElementNode[] => {
      return list.map((el) => {
        if (el.id === selected.id) {
          return { ...el, styles: { ...el.styles, [key]: value } };
        }
        if (el.children) {
          return { ...el, children: updateRecursive(el.children) };
        }
        return el;
      });
    };
    setElements((prev) => updateRecursive(prev));
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-3 py-2">
        <Tabs defaultValue="visual" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-900">
            <TabsTrigger value="visual" className="text-xs">
              Visual
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs">
              Advanced
            </TabsTrigger>
            <TabsTrigger value="events" className="text-xs">
              Events
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Separator className="bg-zinc-800" />

      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-4 p-3">
          <PanelBlock title="Identity">
            <Row label="Tag">
              <Input
                className="h-8 border-zinc-800 bg-zinc-900/60 text-xs"
                value={selected.tag}
                onChange={(e) => updateElement("tag", e.target.value)}
              />
            </Row>
            <Row label="Label">
              <Input
                className="h-8 border-zinc-800 bg-zinc-900/60 text-xs"
                value={selected.label}
                onChange={(e) => updateElement("label", e.target.value)}
              />
            </Row>
          </PanelBlock>

          <PanelBlock title="Layout">
            <Row label="X">
              <Input
                type="number"
                className="h-8 border-zinc-800 bg-zinc-900/60 text-xs"
                value={Math.round(selected.styles.left ?? 0)}
                onChange={(e) => updateStyle("left", parseInt(e.target.value))}
              />
            </Row>
            <Row label="Y">
              <Input
                type="number"
                className="h-8 border-zinc-800 bg-zinc-900/60 text-xs"
                value={Math.round(selected.styles.top ?? 0)}
                onChange={(e) => updateStyle("top", parseInt(e.target.value))}
              />
            </Row>
            <Row label="Width">
              <Input
                type="number"
                className="h-8 border-zinc-800 bg-zinc-900/60 text-xs"
                value={selected.styles.width}
                onChange={(e) =>
                  updateStyle("width", clampInt(e.target.value, 1, 4000))
                }
              />
            </Row>
            <Row label="Height">
              <Input
                type="number"
                className="h-8 border-zinc-800 bg-zinc-900/60 text-xs"
                value={selected.styles.height}
                onChange={(e) =>
                  updateStyle("height", clampInt(e.target.value, 1, 4000))
                }
              />
            </Row>
            <Row label="Z-Index">
              <Input
                type="number"
                className="h-8 border-zinc-800 bg-zinc-900/60 text-xs"
                value={selected.styles.zIndex ?? 0}
                onChange={(e) =>
                  updateStyle("zIndex", parseInt(e.target.value))
                }
              />
            </Row>
          </PanelBlock>

          <PanelBlock title="Appearance">
            <Row label="Bg Color">
              <ColorPicker
                color={selected.styles.backgroundColor}
                onChange={(c) => updateStyle("backgroundColor", c)}
              />
            </Row>
            <Row label="Text Color">
              <ColorPicker
                color={selected.styles.color}
                onChange={(c) => updateStyle("color", c)}
              />
            </Row>
          </PanelBlock>

          {(selected.type === "text" || selected.type === "button") && (
            <PanelBlock title="Content">
              <Row label="Text">
                <Input
                  className="h-8 border-zinc-800 bg-zinc-900/60 text-xs"
                  value={selected.text ?? ""}
                  onChange={(e) => updateElement("text", e.target.value)}
                />
              </Row>
            </PanelBlock>
          )}

          {selected.type === "image" && (
            <PanelBlock title="Image">
              <Row label="Source URL">
                <Input
                  className="h-8 border-zinc-800 bg-zinc-900/60 text-xs"
                  value={selected.src ?? ""}
                  onChange={(e) => updateElement("src", e.target.value)}
                />
              </Row>
            </PanelBlock>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
