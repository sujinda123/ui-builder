import { Button } from "@/components/ui/button";
import { ExplorerSection } from "@/components/ExplorerSection";
import { Breakpoint } from "@/lib/types";
import { PresetName } from "@/lib/presets";

export function PresetsPanel(props: {
  containerStyles: { gap: number; layout: "row" | "column" | "stack" };
  active: Breakpoint;
  addPresetAt: (preset: PresetName, x: number, y: number) => void;
}) {
  const { containerStyles, active, addPresetAt } = props;
  const handleClick = (preset: PresetName) => {
    if (containerStyles.layout === "stack") {
      addPresetAt(preset, active.width / 2, active.height / 2);
    } else {
      addPresetAt(preset, 0, 0);
    }
  };
  return (
    <ExplorerSection title="Components">
      <div className="grid grid-cols-2 gap-2 px-2">
        <Button
          variant="outline"
          className="h-8 text-xs border-zinc-800"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/preset", "card");
            e.dataTransfer.effectAllowed = "copy";
          }}
          onClick={() => handleClick("card")}
        >
          Card
        </Button>
        <Button
          variant="outline"
          className="h-8 text-xs border-zinc-800"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/preset", "hero");
            e.dataTransfer.effectAllowed = "copy";
          }}
          onClick={() => handleClick("hero")}
        >
          Hero
        </Button>
        <Button
          variant="outline"
          className="h-8 text-xs border-zinc-800"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/preset", "cta");
            e.dataTransfer.effectAllowed = "copy";
          }}
          onClick={() => handleClick("cta")}
        >
          CTA
        </Button>
        <Button
          variant="outline"
          className="h-8 text-xs border-zinc-800"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/preset", "avatar-row");
            e.dataTransfer.effectAllowed = "copy";
          }}
          onClick={() => handleClick("avatar-row")}
        >
          Avatar Row
        </Button>
        <Button
          variant="outline"
          className="h-8 text-xs border-zinc-800"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/preset", "navbar");
            e.dataTransfer.effectAllowed = "copy";
          }}
          onClick={() => handleClick("navbar")}
        >
          Navbar
        </Button>
        <Button
          variant="outline"
          className="h-8 text-xs border-zinc-800"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/preset", "login-form");
            e.dataTransfer.effectAllowed = "copy";
          }}
          onClick={() => handleClick("login-form")}
        >
          Login Form
        </Button>
        <Button
          variant="outline"
          className="h-8 text-xs border-zinc-800"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/preset", "pricing-table");
            e.dataTransfer.effectAllowed = "copy";
          }}
          onClick={() => handleClick("pricing-table")}
        >
          Pricing Table
        </Button>
        <Button
          variant="outline"
          className="h-8 text-xs border-zinc-800"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/preset", "product-card");
            e.dataTransfer.effectAllowed = "copy";
          }}
          onClick={() => handleClick("product-card")}
        >
          Product Card
        </Button>
      </div>
    </ExplorerSection>
  );
}
