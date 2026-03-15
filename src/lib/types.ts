export type Breakpoint = {
  id: string;
  name: string;
  width: number;
  height: number;
};

export type ElementType =
  | "box"
  | "text"
  | "button"
  | "image"
  // New types
  | "row"
  | "column"
  | "grid"
  | "heading"
  | "link"
  | "video"
  | "iframe"
  | "code";

export type ElementNode = {
  id: string;
  type: ElementType;
  tag: string;
  label: string;
  styles: {
    width: number | string; // Changed to allow "100%", "auto"
    height: number | string; // Changed to allow "100%", "auto"
    backgroundColor?: string;
    color?: string;
    zIndex?: number;
    left?: number;
    top?: number;
    borderRadius?: number;
    opacity?: number;
    border?: string;
    boxShadow?: string;
    padding?: string;
    fontSize?: number;
    fontWeight?: string;
    textAlign?: "left" | "center" | "right";
    // Flex/Grid props
    display?: "flex" | "grid" | "block";
    flexDirection?: "row" | "column";
    gap?: string;
    alignItems?: string;
    justifyContent?: string;
    gridTemplateColumns?: string;
    position?: "absolute" | "relative"; // Important for nesting
    overflow?: string;
  };
  text?: string;
  src?: string;
  href?: string;
  code?: string;
  children?: ElementNode[]; // For nesting
};

export type Page = {
  id: string;
  name: string;
  elements: ElementNode[];
  // Page Layout Settings
  layout?: "row" | "column" | "stack"; // Default to column
  gap?: number;
  padding?: number;
  backgroundColor?: string;
};
