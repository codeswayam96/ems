"use client";

import { useState } from "react";
import { Menu, Zap } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar — passes open state + close handler for mobile drawer */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Mobile topbar ── visible only on mobile/tablet (<md) */}
        <header className="md:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-background/95 backdrop-blur-sm">
          {/* Hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>

          {/* App brand — centered */}
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 rounded-md bg-violet-500 flex items-center justify-center shadow">
              <Zap size={12} className="text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight">EMS System</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
