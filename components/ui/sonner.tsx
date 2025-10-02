"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";
import { cn } from "@/lib/utils";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className={cn("toaster group")}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#0a0a0a",
          "--normal-border": "hsl(215 20% 92%)",
        } as React.CSSProperties
      }
      toastOptions={{
        duration: 2500,
        classNames: {
          toast:
            "group toast bg-white text-foreground border border-border rounded-xl shadow-lg p-4 data-[type=success]:border-primary data-[type=warning]:border-accent data-[type=error]:border-destructive",
          title: "text-[15px] font-semibold",
          description: "text-[13px] text-muted-foreground",
          actionButton:
            "rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1 text-sm",
          cancelButton:
            "rounded-md bg-muted text-foreground hover:bg-muted/80 px-3 py-1 text-sm",
          closeButton: "text-muted-foreground hover:text-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
