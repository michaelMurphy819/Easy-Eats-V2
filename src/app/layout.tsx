import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ReactNode } from "react"; // Added this import
import "./globals.css";
import { MobileNav } from "@/components/layout/MobileNav";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { ModalProvider } from "@/components/providers/ModalProvider";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  title: "Easy Eats | Effortless Cooking",
  description: "Find your next meal!",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="light">
      <body className={`
        ${inter.variable} 
        ${playfair.variable} 
        bg-background 
        text-foreground 
        antialiased 
        font-sans
      `}>
        {/* ModalProvider handles the seamless "Post Recipe" overlay across all pages */}
        <ModalProvider>
          <div className="flex min-h-screen justify-center bg-background">
            
            {/* Desktop Sidebar (Left) */}
            <aside className="hidden lg:block w-64 border-r border-border sticky top-0 h-screen bg-background">
              <DesktopSidebar />
            </aside>

            {/* Main Content Area */}
            <main className="w-full max-w-screen-xl relative overflow-x-hidden border-x border-border bg-background flex flex-col">
              {/* Header Spacer */}
              <div className="h-10 w-full bg-background sticky top-0 z-40" />
              
              {/* Page Content */}
              <div className="flex-1 pb-24 px-4 md:px-8">
                {children}
              </div>
              
              {/* Mobile Navigation (Bottom) */}
              <div className="lg:hidden">
                <MobileNav />
              </div>
            </main>
            
            {/* Symmetrical Spacer (Right) */}
            <div className="hidden lg:block w-64 bg-background" />
          </div>
        </ModalProvider>
      </body>
    </html>
  );
}