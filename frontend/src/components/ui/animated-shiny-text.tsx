import { ComponentPropsWithoutRef, CSSProperties, FC } from "react";

import { cn } from "@/lib/utils";

export interface AnimatedShinyTextProps extends ComponentPropsWithoutRef<"span"> {
  shimmerWidth?: number;
}

export const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({
  children,
  className,
  shimmerWidth = 120,
  ...props
}) => {
  return (
    <span
      style={
        {
          "--shiny-width": `${shimmerWidth}px`
        } as CSSProperties
      }
      className={cn(
        "mx-auto max-w-md text-foreground/70",
        "animate-shiny-text bg-gradient-to-r from-transparent via-foreground/80 via-50% to-transparent bg-[length:var(--shiny-width)_100%] bg-clip-text bg-no-repeat text-transparent",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
