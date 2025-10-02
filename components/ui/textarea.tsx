import * as React from "react"

import { cn } from "@/lib/utils"
import { COMPONENT_ANIMATIONS } from "@/lib/animations"

interface TextareaProps extends React.ComponentProps<"textarea"> {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled' | 'ghost'
  state?: 'default' | 'success' | 'error' | 'warning'
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, size = 'md', variant = 'default', state = 'default', resize = 'vertical', ...props }, ref) => {
    const sizeClasses = {
      sm: 'min-h-12 px-2.5 py-1.5 text-sm',
      md: 'min-h-16 px-3 py-2 text-base md:text-sm', 
      lg: 'min-h-20 px-4 py-3 text-base'
    }
    
    const variantClasses = {
      default: 'border-input bg-transparent',
      filled: 'border-input bg-muted/50 hover:bg-muted/70 focus-visible:bg-background',
      ghost: 'border-transparent bg-transparent hover:bg-muted/50 focus-visible:border-input'
    }
    
    const stateClasses = {
      default: 'focus-visible:border-ring focus-visible:ring-ring/50',
      success: 'border-green-500/50 focus-visible:border-green-500 focus-visible:ring-green-500/20 text-green-900 dark:text-green-100',
      error: 'border-destructive/50 focus-visible:border-destructive focus-visible:ring-destructive/20 text-destructive',
      warning: 'border-yellow-500/50 focus-visible:border-yellow-500 focus-visible:ring-yellow-500/20 text-yellow-900 dark:text-yellow-100'
    }
    
    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x', 
      both: 'resize'
    }
    
    return (
      <textarea
        data-slot="textarea"
        className={cn(
          "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex field-sizing-content w-full rounded-md border shadow-xs transition-all duration-200 outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 hover:shadow-sm focus-visible:shadow-md",
          sizeClasses[size],
          variantClasses[variant],
          stateClasses[state],
          resizeClasses[resize],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Textarea.displayName = "Textarea"

export { Textarea }
