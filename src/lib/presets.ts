import { Breakpoint, ElementNode } from "@/lib/types";
import { clampNum } from "@/lib/math";

export type PresetName =
  | "card"
  | "hero"
  | "cta"
  | "avatar-row"
  | "navbar"
  | "login-form"
  | "pricing-table"
  | "product-card";

export function buildPreset(
  preset: PresetName,
  x: number,
  y: number,
  active: Breakpoint,
) {
  const makeId = () => crypto.randomUUID();
  const within = (lx: number, ly: number) => ({
    left: clampNum(lx, 0, active.width),
    top: clampNum(ly, 0, active.height),
  });
  const els: ElementNode[] = [];
  if (preset === "card") {
    els.push(
      {
        id: makeId(),
        type: "image",
        tag: "img",
        label: "Card Image",
        src: "https://picsum.photos/400/240",
        styles: {
          width: 300,
          height: 160,
          backgroundColor: "transparent",
          color: "#111827",
          ...within(x - 150, y - 110),
        },
      },
      {
        id: makeId(),
        type: "text",
        tag: "div",
        label: "Title",
        text: "Beautiful Card Title",
        styles: {
          width: 300,
          height: 30,
          backgroundColor: "transparent",
          color: "#111827",
          ...within(x - 150, y + 60),
        },
      },
      {
        id: makeId(),
        type: "text",
        tag: "div",
        label: "Description",
        text: "Short description goes here.",
        styles: {
          width: 300,
          height: 40,
          backgroundColor: "transparent",
          color: "#4b5563",
          ...within(x - 150, y + 96),
        },
      },
      {
        id: makeId(),
        type: "button",
        tag: "button",
        label: "Action",
        text: "Learn more",
        styles: {
          width: 120,
          height: 36,
          backgroundColor: "#2563eb",
          color: "#ffffff",
          ...within(x - 60, y + 140),
        },
      },
    );
  } else if (preset === "hero") {
    els.push(
      {
        id: makeId(),
        type: "text",
        tag: "div",
        label: "Hero Title",
        text: "Build UI faster",
        styles: {
          width: 520,
          height: 60,
          backgroundColor: "transparent",
          color: "#111827",
          ...within(x - 260, y - 40),
        },
      },
      {
        id: makeId(),
        type: "text",
        tag: "div",
        label: "Hero Subtitle",
        text: "Drag, drop, and publish.",
        styles: {
          width: 480,
          height: 36,
          backgroundColor: "transparent",
          color: "#4b5563",
          ...within(x - 240, y + 24),
        },
      },
      {
        id: makeId(),
        type: "button",
        tag: "button",
        label: "Get Started",
        text: "Get Started",
        styles: {
          width: 140,
          height: 40,
          backgroundColor: "#16a34a",
          color: "#ffffff",
          ...within(x - 70, y + 76),
        },
      },
    );
  } else if (preset === "cta") {
    els.push(
      {
        id: makeId(),
        type: "text",
        tag: "div",
        label: "CTA Title",
        text: "Ready to try?",
        styles: {
          width: 300,
          height: 40,
          backgroundColor: "transparent",
          color: "#111827",
          ...within(x - 150, y - 20),
        },
      },
      {
        id: makeId(),
        type: "button",
        tag: "button",
        label: "CTA Button",
        text: "Sign up",
        styles: {
          width: 120,
          height: 36,
          backgroundColor: "#2563eb",
          color: "#ffffff",
          ...within(x - 60, y + 28),
        },
      },
    );
  } else if (preset === "avatar-row") {
    const count = 5;
    for (let i = 0; i < count; i++) {
      els.push({
        id: makeId(),
        type: "image",
        tag: "img",
        label: `Avatar ${i + 1}`,
        src: `https://i.pravatar.cc/80?img=${10 + i}`,
        styles: {
          width: 48,
          height: 48,
          backgroundColor: "transparent",
          color: "#111827",
          ...within(x - (count * 52) / 2 + i * 52, y - 24),
        },
      });
    }
  } else if (preset === "navbar") {
    els.push(
      {
        id: makeId(),
        type: "text",
        tag: "div",
        label: "Logo",
        text: "MyBrand",
        styles: {
          width: 120,
          height: 32,
          backgroundColor: "transparent",
          color: "#111827",
          ...within(x - 180, y - 16),
        },
      },
      ...["Home", "Products", "Pricing", "Contact"].map(
        (t, i): ElementNode => ({
          id: makeId(),
          type: "text",
          tag: "div",
          label: `Nav ${t}`,
          text: t,
          styles: {
            width: 90,
            height: 28,
            backgroundColor: "transparent",
            color: "#4b5563",
            ...within(x - 40 + i * 96, y - 14),
          },
        }),
      ),
      {
        id: makeId(),
        type: "button",
        tag: "button",
        label: "Sign in",
        text: "Sign in",
        styles: {
          width: 100,
          height: 32,
          backgroundColor: "#2563eb",
          color: "#ffffff",
          ...within(x + 340, y - 16),
        },
      },
    );
  } else if (preset === "login-form") {
    els.push(
      {
        id: makeId(),
        type: "text",
        tag: "div",
        label: "Login Title",
        text: "Welcome back",
        styles: {
          width: 240,
          height: 32,
          backgroundColor: "transparent",
          color: "#111827",
          ...within(x - 120, y - 80),
        },
      },
      {
        id: makeId(),
        type: "text",
        tag: "div",
        label: "Email Label",
        text: "Email",
        styles: {
          width: 240,
          height: 20,
          backgroundColor: "transparent",
          color: "#4b5563",
          ...within(x - 120, y - 40),
        },
      },
      {
        id: makeId(),
        type: "box",
        tag: "div",
        label: "Email Input",
        styles: {
          width: 240,
          height: 32,
          backgroundColor: "#ffffff",
          color: "#111827",
          ...within(x - 120, y - 16),
        },
      },
      {
        id: makeId(),
        type: "text",
        tag: "div",
        label: "Password Label",
        text: "Password",
        styles: {
          width: 240,
          height: 20,
          backgroundColor: "transparent",
          color: "#4b5563",
          ...within(x - 120, y + 24),
        },
      },
      {
        id: makeId(),
        type: "box",
        tag: "div",
        label: "Password Input",
        styles: {
          width: 240,
          height: 32,
          backgroundColor: "#ffffff",
          color: "#111827",
          ...within(x - 120, y + 48),
        },
      },
      {
        id: makeId(),
        type: "button",
        tag: "button",
        label: "Login",
        text: "Login",
        styles: {
          width: 100,
          height: 36,
          backgroundColor: "#16a34a",
          color: "#ffffff",
          ...within(x - 50, y + 96),
        },
      },
    );
  } else if (preset === "pricing-table") {
    const cols = 3;
    for (let i = 0; i < cols; i++) {
      els.push(
        {
          id: makeId(),
          type: "text",
          tag: "div",
          label: `Plan ${i + 1}`,
          text: `Plan ${i + 1}`,
          styles: {
            width: 200,
            height: 28,
            backgroundColor: "transparent",
            color: "#111827",
            ...within(x - (cols * 220) / 2 + i * 220, y - 40),
          },
        },
        {
          id: makeId(),
          type: "text",
          tag: "div",
          label: `Price ${i + 1}`,
          text: `$${(i + 1) * 9}/mo`,
          styles: {
            width: 200,
            height: 24,
            backgroundColor: "transparent",
            color: "#4b5563",
            ...within(x - (cols * 220) / 2 + i * 220, y - 8),
          },
        },
        {
          id: makeId(),
          type: "button",
          tag: "button",
          label: `Select ${i + 1}`,
          text: "Select",
          styles: {
            width: 120,
            height: 32,
            backgroundColor: "#2563eb",
            color: "#ffffff",
            ...within(x - (cols * 220) / 2 + i * 220 + 40, y + 24),
          },
        },
      );
    }
  } else if (preset === "product-card") {
    els.push(
      {
        id: makeId(),
        type: "image",
        tag: "img",
        label: "Product Image",
        src: "https://picsum.photos/360/240",
        styles: {
          width: 300,
          height: 160,
          backgroundColor: "transparent",
          color: "#111827",
          ...within(x - 150, y - 110),
        },
      },
      {
        id: makeId(),
        type: "text",
        tag: "div",
        label: "Product Title",
        text: "Awesome Product",
        styles: {
          width: 300,
          height: 30,
          backgroundColor: "transparent",
          color: "#111827",
          ...within(x - 150, y + 60),
        },
      },
      {
        id: makeId(),
        type: "text",
        tag: "div",
        label: "Product Price",
        text: "$49",
        styles: {
          width: 300,
          height: 24,
          backgroundColor: "transparent",
          color: "#16a34a",
          ...within(x - 150, y + 92),
        },
      },
      {
        id: makeId(),
        type: "button",
        tag: "button",
        label: "Buy Now",
        text: "Buy Now",
        styles: {
          width: 120,
          height: 36,
          backgroundColor: "#2563eb",
          color: "#ffffff",
          ...within(x - 60, y + 130),
        },
      },
    );
  }
  return els;
}
