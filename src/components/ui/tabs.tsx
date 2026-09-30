"use client";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

/** Tabs — sección 3.10: borde inferior 2px, indicador activo naranja de marca. */
export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("flex gap-0.5 border-b-2 border-[var(--color-border)] overflow-x-auto", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "px-4 py-2 text-[var(--text-base)] font-semibold whitespace-nowrap -mb-0.5 border-b-2 border-transparent text-[var(--color-text-secondary)]",
        "data-[state=active]:text-brand-blue-700 data-[state=active]:border-brand-orange-500",
        className
      )}
      {...props}
    />
  );
}

export const TabsContent = TabsPrimitive.Content;
