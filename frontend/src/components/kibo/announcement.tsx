import * as React from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

type AnnouncementProps = {
  label: string;
  title: string;
  href?: string;
  className?: string;
};

export function Announcement({ label, title, href, className }: AnnouncementProps) {
  const content = (
    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
      {label}
      <span className="text-sm font-medium normal-case tracking-normal text-foreground">
        {title}
      </span>
      <ArrowRight className="h-3 w-3 text-muted-foreground" />
    </span>
  );

  if (href) {
    return (
      <a
        href={href}
        className={cn(
          "inline-flex items-center rounded-full border bg-background px-4 py-2 transition hover:border-foreground/30",
          className
        )}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border bg-background px-4 py-2",
        className
      )}
    >
      {content}
    </div>
  );
}
