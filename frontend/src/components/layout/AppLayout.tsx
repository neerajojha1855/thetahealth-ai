import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { useState, useEffect } from "react"

export function AppLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      
      // If we are on desktop/tablet, ensure the mobile overlay is closed
      if (width >= 768) {
        setIsMobileSidebarOpen(false);
      }
      
      // Auto-collapse the desktop sidebar on tablets to save space
      if (width >= 768 && width < 1024) {
        setIsDesktopSidebarCollapsed(true);
      } else if (width >= 1024) {
        setIsDesktopSidebarCollapsed(false);
      }
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080c14] text-slate-100 antialiased">
      {/* Sidebar navigation */}
      <Sidebar
        isMobile={isMobile}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isDesktopSidebarCollapsed={isDesktopSidebarCollapsed}
        onToggleDesktopSidebarCollapsed={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          isMobile={isMobile}
          isMobileSidebarOpen={isMobileSidebarOpen}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:px-8 xl:max-w-7xl xl:mx-auto bg-radial from-slate-900/40 via-[#080c14] to-[#080c14]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}