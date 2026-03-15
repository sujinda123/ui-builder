import * as React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function PanelBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="text-xs font-semibold text-zinc-300">{title}</div>
        <Button
          variant="ghost"
          className="h-7 px-2 text-xs text-zinc-400 hover:bg-zinc-900"
        >
          ▾
        </Button>
      </div>
      <Separator className="bg-zinc-800" />
      <div className="space-y-2 p-3">{children}</div>
    </div>
  );
}
