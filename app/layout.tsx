import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aturservicett Admin",
  description: "Aturservicett administration dashboard",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
