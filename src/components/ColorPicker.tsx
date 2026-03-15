"use client";

import * as React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "transparent",
  "#ffffff",
  "#000000",
  // Grays
  "#f4f4f5",
  "#e4e4e7",
  "#d4d4d8",
  "#a1a1aa",
  "#71717a",
  "#52525b",
  "#3f3f46",
  "#27272a",
  "#18181b",
  // Colors
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#eab308", // Yellow
  "#84cc16", // Lime
  "#22c55e", // Green
  "#10b981", // Emerald
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#0ea5e9", // Sky
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#a855f7", // Purple
  "#d946ef", // Fuchsia
  "#ec4899", // Pink
  "#f43f5e", // Rose
];

interface ColorPickerProps {
  color?: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ color, onChange, className }: ColorPickerProps) {
  const [value, setValue] = React.useState(color ?? "");

  React.useEffect(() => {
    setValue(color ?? "");
  }, [color]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setValue(newVal);
    onChange(newVal);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal px-2 h-8 border-zinc-800 bg-zinc-900/60",
            !color && "text-muted-foreground",
            className
          )}
        >
          <div className="w-full flex items-center gap-2">
            <div
              className="h-4 w-4 rounded border border-zinc-700 shadow-sm"
              style={{
                backgroundColor: color === "transparent" ? undefined : color,
                backgroundImage:
                  color === "transparent"
                    ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                    : undefined,
                backgroundSize: "8px 8px",
                backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
              }}
            />
            <span className="truncate text-xs flex-1">
              {color ? color : "Pick a color"}
            </span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 border-zinc-800 bg-zinc-950 p-3">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {PRESET_COLORS.map((c) => (
              <div
                key={c}
                className={cn(
                  "h-6 w-6 cursor-pointer rounded-md border border-zinc-800 hover:scale-110 transition-transform active:scale-95",
                  color === c && "ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-950"
                )}
                style={{
                  backgroundColor: c === "transparent" ? undefined : c,
                  backgroundImage:
                    c === "transparent"
                      ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                      : undefined,
                  backgroundSize: "6px 6px",
                  backgroundPosition: "0 0, 0 3px, 3px -3px, -3px 0px",
                }}
                onClick={() => {
                  setValue(c);
                  onChange(c);
                }}
                title={c}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-zinc-400">Hex</div>
            <Input
              value={value}
              onChange={handleInputChange}
              className="h-7 text-xs border-zinc-800 bg-zinc-900"
              placeholder="#000000"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
