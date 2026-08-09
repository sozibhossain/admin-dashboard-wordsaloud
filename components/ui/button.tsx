import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = cva("inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: {
      default: "bg-brand text-white hover:bg-brand-dark",
      outline: "border border-brand bg-transparent text-brand hover:bg-brand-soft",
      ghost: "text-ink hover:bg-black/5",
      danger: "bg-red-600 text-white hover:bg-red-700",
    },
    size: { default: "h-11 px-4", sm: "h-9 px-3 text-xs", icon: "size-9 p-0" },
  }, defaultVariants: { variant: "default", size: "default" },
});

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof variants> & { asChild?: boolean };
export function Button({ className, variant, size, asChild, ...props }: Props) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(variants({ variant, size }), className)} {...props} />;
}
