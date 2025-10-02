import * as React from "react";

import { cn } from "@/lib/utils";
import { COMPONENT_ANIMATIONS } from "@/lib/animations";

interface CardProps extends React.ComponentProps<"div"> {
  hover?: boolean;
  interactive?: boolean;
  elevation?: "none" | "sm" | "md" | "lg" | "xl";
}

function Card({
  className,
  hover = false,
  interactive = false,
  elevation = "sm",
  ...props
}: CardProps) {
  const elevationClasses = {
    none: "shadow-none",
    sm: "hover:shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg hover:shadow-xl",
    xl: "shadow-xl hover:shadow-2xl",
  };

  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 transition-all duration-300",
        elevationClasses[elevation],
        hover && "hover:-translate-y-1 hover:shadow-xl",
        interactive &&
          "cursor-pointer hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10",
        className
      )}
      {...props}
    />
  );
}

interface CardHeaderProps extends React.ComponentProps<"div"> {
  centerContent?: boolean;
}

function CardHeader({
  className,
  centerContent = false,
  ...props
}: CardHeaderProps) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        centerContent && "text-center items-center",
        className
      )}
      {...props}
    />
  );
}

interface CardTitleProps extends React.ComponentProps<"div"> {
  size?: "sm" | "md" | "lg" | "xl";
}

function CardTitle({ className, size = "md", ...props }: CardTitleProps) {
  const sizeClasses = {
    sm: "text-sm font-semibold",
    md: "text-base font-semibold",
    lg: "text-lg font-semibold",
    xl: "text-xl font-bold",
  };

  return (
    <div
      data-slot="card-title"
      className={cn(
        "leading-tight transition-colors duration-200",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}

interface CardDescriptionProps extends React.ComponentProps<"div"> {
  size?: "xs" | "sm" | "md";
}

function CardDescription({
  className,
  size = "sm",
  ...props
}: CardDescriptionProps) {
  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
  };

  return (
    <div
      data-slot="card-description"
      className={cn(
        "text-muted-foreground leading-relaxed transition-colors duration-200",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  );
}

interface CardContentProps extends React.ComponentProps<"div"> {
  noPadding?: boolean;
}

function CardContent({
  className,
  noPadding = false,
  ...props
}: CardContentProps) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        !noPadding && "px-6",
        "transition-all duration-200",
        className
      )}
      {...props}
    />
  );
}

interface CardFooterProps extends React.ComponentProps<"div"> {
  justify?: "start" | "center" | "end" | "between";
  noPadding?: boolean;
}

function CardFooter({
  className,
  justify = "start",
  noPadding = false,
  ...props
}: CardFooterProps) {
  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
  };

  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center [.border-t]:pt-6 gap-2 transition-all duration-200",
        !noPadding && "px-6",
        justifyClasses[justify],
        className
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
