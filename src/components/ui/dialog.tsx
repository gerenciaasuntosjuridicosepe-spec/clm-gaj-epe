"use client";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

/** Modal centrado — sección 3.5 del design system. */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[500] bg-[rgba(0,30,60,0.55)] data-[state=open]:animate-[fadeIn_150ms_ease]" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-[500] max-h-[92vh] w-[680px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[var(--radius-lg)] bg-white shadow-[var(--shadow-lg)]",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-t-[var(--radius-lg)] bg-gradient-to-br from-[var(--color-brand-blue-900)] to-[var(--color-brand-blue-700)] px-5 py-4 text-white",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
