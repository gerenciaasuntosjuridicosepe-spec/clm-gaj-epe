"use client";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

/**
 * Drawer / panel lateral — sección 3.13 del design system: componente ausente
 * en la app de referencia, agregado acá como mejora real (detalle rápido de
 * contrato sin perder el listado de fondo). Se implementa sobre Radix Dialog
 * posicionado a la derecha, en vez de un modal centrado.
 */
export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export function SheetContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[500] bg-[rgba(0,30,60,0.4)]" />
      <DialogPrimitive.Content
        className={cn(
          "fixed right-0 top-0 z-[500] flex h-full w-[420px] max-w-[92vw] flex-col bg-white shadow-[var(--shadow-lg)] focus:outline-none",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function SheetHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 bg-gradient-to-br from-[var(--color-brand-blue-900)] to-[var(--color-brand-blue-700)] px-5 py-4 text-white",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export const SheetTitle = DialogPrimitive.Title;
export const SheetDescription = DialogPrimitive.Description;
