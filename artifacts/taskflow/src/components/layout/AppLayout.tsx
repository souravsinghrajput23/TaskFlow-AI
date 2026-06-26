import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex min-h-screen bg-background text-foreground w-full">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-14 border-b flex items-center px-4 shrink-0 bg-card sticky top-0 z-10 gap-4">
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="shrink-0 text-muted-foreground">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-muted-foreground"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </header>
        
        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
