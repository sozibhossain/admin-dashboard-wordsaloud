import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("h-12 w-full rounded-md border border-[#b7b7b7] bg-white px-4 text-sm outline-none placeholder:text-[#a4a4a4] focus:border-brand focus:ring-2 focus:ring-brand/10", className)} {...props} />;
}
