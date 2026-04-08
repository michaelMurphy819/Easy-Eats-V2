import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ReactNode } from "react";
import "./globals.css";
import { MobileNav } from "@/components/layout/MobileNav";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { ClientProviders } from "@/components/providers/ClientProviders";

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
    <html lang="en" suppressHydrationWarning> 
      <body className={`
        ${inter.variable} 
        ${playfair.variable} 
        bg-background 
        text-foreground 
        antialiased 
        font-sans
      `}>
        {/* All client-side providers are now bundled here */}
        <ClientProviders>
          <div className="flex min-h-screen justify-center bg-background">
            
            {/* Desktop Sidebar (Left) */}
            <aside className="hidden lg:block w-64 border-r border-border sticky top-0 h-screen bg-background">
              <DesktopSidebar />
            </aside>

            {/* Main Content Area */}
            <main className="w-full max-w-screen-xl relative overflow-x-hidden border-x border-border bg-background flex flex-col">
              <div className="h-10 w-full bg-background sticky top-0 z-40" />
              
              <div className="flex-1 pb-24 px-4 md:px-8">
                {children}
              </div>
              
              <div className="lg:hidden">
                <MobileNav />
              </div>
            </main>
            
            <div className="hidden lg:block w-64 bg-background" />
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}