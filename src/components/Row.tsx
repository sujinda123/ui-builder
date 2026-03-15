import * as React from "react";

export function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[90px_1fr] items-center gap-2">
      <div className="text-xs text-zinc-500">{label}</div>
      <div>{children}</div>
    </div>
  );
}
