"use client";

import * as React from "react";
import { buildHtml } from "@/lib/export";
import { IsolatedPreview } from "@/components/IsolatedPreview";
import { Page, ElementNode, Breakpoint } from "@/lib/types";

export default function PreviewPage() {
  const [html, setHtml] = React.useState<string>("");

  React.useEffect(() => {
    try {
      // 1. Try to get preview-specific state first (most recent manual preview click)
      const previewRaw = localStorage.getItem("ui-builder:preview-state");
      
      // 2. Fallback to main editor state if preview state missing
      const editorRaw = localStorage.getItem("ui-builder:state");
      
      // Use previewRaw first, fall back to editorRaw.
      // But we need to parse them differently potentially?
      // previewRaw is { pages, activePageId, containerStyles }
      // editorRaw is { pages, activePageId, containerStyles }
      // They are the same structure.
      
      const raw = previewRaw || editorRaw;

      if (!raw) return;

      const data = JSON.parse(raw);
      
      let pages: Page[] = [];
      let activePageId = "home";
      
      if (Array.isArray(data.pages)) {
        pages = data.pages;
        activePageId = data.activePageId || (pages[0] ? pages[0].id : "home");
      } else if (data.elements) {
        // Legacy or simplified structure
        pages = [{ id: "home", name: "Home", elements: data.elements, layout: "column", gap: 0, padding: 0 }];
        activePageId = "home";
      }

      const activePage = pages.find(p => p.id === activePageId) || pages[0];
      
      if (activePage) {
        const dummyActive: Breakpoint = { 
           id: "preview", 
           name: "Preview", 
           width: window.innerWidth, 
           height: window.innerHeight 
        };
        
        const generated = buildHtml(
            activePage.elements, 
            { 
                layout: activePage.layout || "column", 
                gap: activePage.gap || 0 
            }, 
            dummyActive
        );
        setHtml(generated);
      }
    } catch (e) {
      console.error("Failed to load preview", e);
    }
  }, []);

  if (!html) {
    return (
      <div className="flex items-center justify-center h-screen bg-white text-zinc-400 text-sm">
        Loading Preview...
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-white overflow-auto">
      <IsolatedPreview html={html} js="" />
    </div>
  );
}
