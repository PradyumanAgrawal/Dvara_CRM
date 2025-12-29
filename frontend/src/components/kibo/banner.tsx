import * as React from "react";

import { cn } from "@/lib/utils";

type BannerProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function Banner({ title, description, actions, className }: BannerProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div>
        <div className="text-sm font-semibold">{title}</div>
        {description ? (
          <div className="text-sm text-muted-foreground">{description}</div>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
