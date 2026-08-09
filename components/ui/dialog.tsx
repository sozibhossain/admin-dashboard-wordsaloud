"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ className, children, ...props }: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[3px] data-[state=open]:animate-in" />
      <DialogPrimitive.Content className={cn("fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-white p-6 shadow-2xl outline-none", className)} {...props}>
        {children}
        <DialogPrimitive.Close className="absolute right-5 top-5 rounded p-1 text-muted hover:bg-black/5" aria-label="Close"><X size={20} /></DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
export const DialogTitle = ({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) => <DialogPrimitive.Title className={cn("text-lg font-bold", className)} {...props} />;
export const DialogDescription = DialogPrimitive.Description;
