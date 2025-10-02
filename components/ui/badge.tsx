import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-200 overflow-hidden hover:scale-105 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90 hover:shadow-md hover:shadow-secondary/20",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 hover:shadow-md hover:shadow-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground hover:shadow-sm hover:border-accent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  pulse?: boolean;
}

function Badge({
  className,
  variant,
  asChild = false,
  size = "md",
  animated = false,
  pulse = false,
  ...props
}: BadgeProps) {
  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2 py-0.5 text-xs",
    lg: "px-2.5 py-1 text-sm",
  };
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(
        badgeVariants({ variant }),
        sizeClasses[size],
        animated && "animate-in fade-in slide-in-from-bottom-1 duration-300",
        pulse && "animate-pulse",
        className
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
