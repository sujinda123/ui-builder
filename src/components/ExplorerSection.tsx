import * as React from "react";
import { Button } from "@/components/ui/button";

export function ExplorerSection({
  title,
  children,
  onAdd,
}: {
  title: string;
  children: React.ReactNode;
  onAdd?: () => void;
}) {
  return (
    <div className="mb-3">
      <div className="mb-2 flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        <span>{title}</span>
        {onAdd && (
          <Button
            variant="ghost"
            className="h-6 px-2 text-[11px] text-zinc-400 hover:bg-zinc-900"
            onClick={onAdd}
          >
            +
          </Button>
        )}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
