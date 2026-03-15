import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown } from "lucide-react";

export function TreeItem({
  label,
  active,
  onClick,
  children,
  expanded: initialExpanded = true,
  depth = 0,
}: {
  label: string;
  active?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
  expanded?: boolean;
  depth?: number;
}) {
  const [isExpanded, setIsExpanded] = React.useState(initialExpanded);

  return (
    <div>
      <div
        onClick={onClick}
        className={[
          "flex items-center justify-between rounded-md py-1 pr-2 text-sm select-none group",
          active
            ? "bg-blue-600/20 text-blue-100 ring-1 ring-blue-600/40"
            : "hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200",
        ].join(" ")}
        style={{ paddingLeft: `${(depth * 12) + 4}px` }}
      >
        <div className="flex items-center gap-1 flex-1 overflow-hidden">
          <div
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-zinc-800 cursor-pointer shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              if (children) setIsExpanded(!isExpanded);
            }}
          >
            {children ? (
              isExpanded ? (
                <ChevronDown className="h-3 w-3 opacity-70" />
              ) : (
                <ChevronRight className="h-3 w-3 opacity-70" />
              )
            ) : (
              <div className="w-3" />
            )}
          </div>
          <span className="text-[12px] truncate cursor-pointer flex-1" onClick={onClick}>{label}</span>
        </div>
        {active ? (
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
        ) : null}
      </div>
      {isExpanded && children && (
        <div className="border-l border-zinc-800/20 ml-[11px]">
          {children}
        </div>
      )}
    </div>
  );
}
