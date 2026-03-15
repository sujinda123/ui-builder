# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev       # Start Next.js dev server

# Build & production
npm run build
npm run start

# Linting
npm run lint      # ESLint with Next.js + Prettier rules
```

No test suite is configured.

## Code Style

- Prettier: `printWidth: 180`, `tabWidth: 4`, single quotes, trailing commas, Tailwind class sorting
- Path alias: `@/*` → `src/*`
- Dark mode is always active (hardcoded `className="dark"` on `<html>`)
- Font: Noto Sans Thai (Thai language UI throughout)
- Tailwind CSS v4 with shadcn/ui "new-york" style, zinc base color

## Architecture

### UI Builder (core feature)

The visual page builder lives in `src/app/Home.tsx` (1151 lines). It is a three-panel layout:

- **Left:** Pages/layers tree + drag-to-add element palette + presets panel
- **Center:** Responsive canvas with breakpoint selector and zoom controls
- **Right:** `PropertiesPanel` for editing selected element/page properties

State is managed entirely in `src/hooks/useEditor.ts`, which persists to `localStorage` under key `ui-builder:state`. The state includes pages, elements (recursive `ElementNode` tree), active page/breakpoint, and container styles.

Drag-and-drop is handled by `src/hooks/useCanvasDnD.ts` (move + 8-direction resize). The canvas renders via `src/components/CanvasArea.tsx` using a recursive `RenderElement` component.

HTML export (`src/lib/export.ts`) converts the `ElementNode` tree to an inline-styled HTML string. The preview page (`src/app/preview/`) reads the same localStorage state and renders it in an iframe via `IsolatedPreview`.

Key types are in `src/lib/types.ts`: `ElementType`, `ElementNode`, `Page`, `Breakpoint`.

Presets (card, hero, navbar, login-form, etc.) are defined in `src/lib/presets.ts` and use picsum.photos for placeholder images.

### Game AI (secondary feature)

Two games are embedded as separate routes:

**Thai Checkers** (`/hos`):
- Game logic: `src/lib/thai-checkers.ts` (ThaiCheckers8 class)
- AI: `src/lib/ai.ts` — negamax with alpha-beta pruning + TFLite value network
- Model wrapper: `src/lib/tflite-value.ts` (loads from `/public/models/thai_checkers_8_value.tflite`)
- API route: `src/app/api/hos/move/route.ts` — singleton model instance, calls `chooseMoveSearch`

**Tic-tac-toe** (`/xo`):
- API route: `src/app/api/xo/move/route.ts` — spawns Python subprocess `src/server/xo_dqn_infer.py`
- Model: `/public/models/xo_dqn.tflite`
- Direct model file access is blocked by `middleware.ts` and the `/api/xo/model` 404 route

The Python inference scripts in `src/server/` support `ai_edge_litert`, `tflite_runtime`, or `tensorflow` backends for TFLite inference.

### Element Data Model

```typescript
// A page contains a flat-or-nested tree of ElementNodes
Page { id, name, elements: ElementNode[], layout: "row"|"column"|"stack", gap, padding, backgroundColor }
ElementNode { id, type: ElementType, tag, label, styles: CSSProperties, text, src, href, code, children: ElementNode[] }
```

Layout type `"stack"` = absolute positioning; `"row"`/`"column"` = flex flow layouts.
