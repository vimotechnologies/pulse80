"use client";

import * as React from "react";

import { cn } from "@/lib/utils/cn";

type PopoverContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

function usePopover() {
  const context = React.useContext(PopoverContext);
  if (!context) throw new Error("Popover components must be used inside Popover.");
  return context;
}

export function Popover({ open: controlledOpen, onOpenChange, children }: { open?: boolean; onOpenChange?: (open: boolean) => void; children: React.ReactNode }) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = React.useCallback((nextOpen: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }, [controlledOpen, onOpenChange]);

  React.useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen]);

  return <PopoverContext.Provider value={{ open, setOpen }}><div ref={rootRef} className="relative">{children}</div></PopoverContext.Provider>;
}

export function PopoverTrigger({ asChild = false, children }: { asChild?: boolean; children: React.ReactElement<{ onClick?: React.MouseEventHandler; "aria-expanded"?: boolean }> }) {
  const { open, setOpen } = usePopover();
  if (asChild) {
    return React.cloneElement(children, {
      "aria-expanded": open,
      onClick: (event) => {
        children.props.onClick?.(event);
        if (!event.defaultPrevented) setOpen(!open);
      },
    });
  }
  return <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>{children}</button>;
}

export function PopoverContent({ align = "start", className, children }: { align?: "start" | "center" | "end"; className?: string; children: React.ReactNode }) {
  const { open } = usePopover();
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="false"
      className={cn(
        "absolute top-[calc(100%+0.5rem)] z-50 rounded-xl border border-card-border bg-white p-3 text-navy shadow-xl outline-none",
        align === "center" && "left-1/2 -translate-x-1/2",
        align === "end" ? "right-0" : align === "start" ? "left-0" : null,
        className,
      )}
    >
      {children}
    </div>
  );
}
