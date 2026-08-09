import type { ReactNode } from "react";
import { Brand } from "./brand";

export function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center overflow-x-hidden bg-surface py-10"><section className="w-[calc(100vw-2rem)] max-w-[500px] text-center"><Brand compact /><div className="mb-8 mt-10"><h1 className="text-4xl font-bold text-brand">{title}</h1><p className="mt-1 text-sm text-ink">{subtitle}</p></div>{children}</section></main>;
}
