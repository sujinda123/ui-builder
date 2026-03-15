import { Breakpoint, ElementNode } from "@/lib/types";

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] as string,
  );
}

function escapeAttr(s: string) {
  return escapeHtml(s);
}

export function buildHtml(
  elements: ElementNode[],
  container: { gap: number; layout: "row" | "column" | "stack" },
  active: Breakpoint,
) {
  const containerStyle =
    container.layout === "stack"
      ? `position:relative;width:${active.width}px;height:${active.height}px;`
      : `display:flex;flex-direction:${container.layout};gap:${container.gap}px;width:${active.width}px;height:${active.height}px;`;

  const children = elements
    .map((el) => {
      const styleProps = [
        `width:${el.styles.width}px`,
        `height:${el.styles.height}px`,
        `background-color:${el.styles.backgroundColor ?? "transparent"}`,
        `color:${el.styles.color ?? "inherit"}`,
        `border-radius:${el.styles.borderRadius ? `${el.styles.borderRadius}px` : "0"}`,
        `opacity:${el.styles.opacity ?? 1}`,
        `border:${el.styles.border ?? "none"}`,
        `box-shadow:${el.styles.boxShadow ?? "none"}`,
        `padding:${el.styles.padding ?? "0"}`,
        `font-size:${el.styles.fontSize ? `${el.styles.fontSize}px` : "inherit"}`,
        `font-weight:${el.styles.fontWeight ?? "normal"}`,
        `text-align:${el.styles.textAlign ?? "left"}`,
        `z-index:${el.styles.zIndex ?? "auto"}`,
      ];

      if (container.layout === "stack") {
        styleProps.push(
          `position:absolute`,
          `left:${el.styles.left ?? 0}px`,
          `top:${el.styles.top ?? 0}px`,
        );
      }

      const styleStr = styleProps.join(";");

      if (el.type === "text") {
        return `<div style="${styleStr};display:flex;align-items:center;justify-content:${el.styles.textAlign === "center" ? "center" : el.styles.textAlign === "right" ? "flex-end" : "flex-start"}">${escapeHtml(el.text ?? "")}</div>`;
      }

      if (el.type === "button") {
        // For button, we might want the button tag to be the main element
        // But for consistency with editor (which wraps in div), let's keep wrapper but apply styles to it?
        // Actually, in editor, Button is inside a div.
        // Let's make it a button tag directly if possible, or a div with button inside.
        // If we make it a button tag, we lose the wrapper behavior if any.
        // Let's stick to div wrapper for layout, and button inside.
        // But wait, the user styles apply to the "element".
        return `<button style="${styleStr};border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;">${escapeHtml(el.text ?? el.label)}</button>`;
      }

      if (el.type === "image") {
        return `<img src="${escapeAttr(el.src ?? "")}" alt="${escapeAttr(el.label)}" style="${styleStr};object-fit:cover" />`;
      }

      return `<div style="${styleStr};display:flex;align-items:center;justify-content:center;">${escapeHtml(el.label)}</div>`;
    })
    .join("");

  return `<div style="${containerStyle};overflow:hidden;background-color:#ffffff;" class="p-6">${children}</div>`;
}
