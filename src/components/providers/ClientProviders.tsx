'use client';

import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { ModalProvider } from "@/components/providers/ModalProvider";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ModalProvider>
        {children}
      </ModalProvider>
    </ThemeProvider>
  );
}