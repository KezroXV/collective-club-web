"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { COMPONENT_ANIMATIONS } from "@/lib/animations";

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

interface DialogOverlayProps extends React.ComponentProps<typeof DialogPrimitive.Overlay> {
  blur?: boolean
}

function DialogOverlay({
  className,
  blur = true,
  ...props
}: DialogOverlayProps) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 duration-300",
        blur && "backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}

interface DialogContentProps extends React.ComponentProps<typeof DialogPrimitive.Content> {
  showCloseButton?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  centered?: boolean
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  size = 'md',
  centered = true,
  ...props
}: DialogContentProps) {
  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg', 
    xl: 'sm:max-w-xl',
    full: 'sm:max-w-6xl'
  }
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-bottom-2 data-[state=open]:slide-in-from-bottom-2 fixed z-50 grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-xl border p-6 shadow-2xl duration-300",
          centered ? "top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]" : "top-4 left-[50%] translate-x-[-50%]",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-md opacity-70 transition-all duration-200 hover:opacity-100 hover:bg-accent hover:scale-110 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 p-1"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

interface DialogHeaderProps extends React.ComponentProps<"div"> {
  centered?: boolean
}

function DialogHeader({ className, centered = false, ...props }: DialogHeaderProps) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex flex-col gap-2",
        centered ? "text-center" : "text-center sm:text-left",
        "animate-in fade-in slide-in-from-top-2 duration-300 delay-100",
        className
      )}
      {...props}
    />
  );
}

interface DialogFooterProps extends React.ComponentProps<"div"> {
  justify?: 'start' | 'center' | 'end' | 'between'
  stacked?: boolean
}

function DialogFooter({ className, justify = 'end', stacked = false, ...props }: DialogFooterProps) {
  const justifyClasses = {
    start: 'sm:justify-start',
    center: 'sm:justify-center',
    end: 'sm:justify-end', 
    between: 'sm:justify-between'
  }
  
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200",
        stacked ? "flex-col" : "flex-col-reverse sm:flex-row",
        justifyClasses[justify],
        className
      )}
      {...props}
    />
  );
}

interface DialogTitleProps extends React.ComponentProps<typeof DialogPrimitive.Title> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

function DialogTitle({
  className,
  size = 'lg',
  ...props
}: DialogTitleProps) {
  const sizeClasses = {
    sm: 'text-base font-semibold',
    md: 'text-lg font-semibold',
    lg: 'text-xl font-semibold',
    xl: 'text-2xl font-bold'
  }
  
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("leading-tight transition-colors duration-200", sizeClasses[size], className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
