import * as React from "react";

import { cn } from "@/lib/utils";
import { COMPONENT_ANIMATIONS } from "@/lib/animations";

type InputSize = "sm" | "md" | "lg";
type InputVariant = "default" | "filled" | "ghost";
type InputState = "default" | "success" | "error" | "warning";

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: InputSize;
  variant?: InputVariant;
  state?: InputState;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      size = "md",
      variant = "default",
      state = "default",
      leftIcon,
      rightIcon,
      loading = false,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "h-8 px-2.5 py-1 text-sm",
      md: "h-9 px-3 py-1 text-base md:text-sm",
      lg: "h-10 px-4 py-2 text-base",
    };

    const variantClasses = {
      default: "border-input bg-transparent",
      filled:
        "border-input bg-muted/50 hover:bg-muted/70 focus-visible:bg-background",
      ghost:
        "border-transparent bg-transparent hover:bg-muted/50 focus-visible:border-input",
    };

    const stateClasses = {
      default: "focus-visible:border-ring focus-visible:ring-ring/50",
      success:
        "border-green-500/50 focus-visible:border-green-500 focus-visible:ring-green-500/20 text-green-900 dark:text-green-100",
      error:
        "border-destructive/50 focus-visible:border-destructive focus-visible:ring-destructive/20 text-destructive",
      warning:
        "border-yellow-500/50 focus-visible:border-yellow-500 focus-visible:ring-yellow-500/20 text-yellow-900 dark:text-yellow-100",
    };

    const baseClasses =
      "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex w-full min-w-0 rounded-md border shadow-xs transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-[3px] hover:shadow-sm";

    if (leftIcon || rightIcon || loading) {
      return (
        <div className="relative">
          {(leftIcon || loading) && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {loading ? (
                <div className="animate-spin size-4 border-2 border-current border-r-transparent rounded-full" />
              ) : (
                leftIcon
              )}
            </div>
          )}
          <input
            type={type}
            data-slot="input"
            className={cn(
              baseClasses,
              sizeClasses[size],
              variantClasses[variant],
              stateClasses[state],
              (leftIcon || loading) && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        data-slot="input"
        className={cn(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          stateClasses[state],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
