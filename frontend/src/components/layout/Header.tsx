import {
  Bell,
  Search,
  Flame,
  Radio,
  ChevronLeft, // For mobile menu icon
  ChevronRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export function Header({
  isMobile,
  isMobileSidebarOpen,
  onToggleMobileSidebar
}: {
  isMobile: boolean;
  isMobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
}) {
  const navigate = useNavigate()

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Mobile Menu Button (only on mobile) */}
      {isMobile && (
        <button
          onClick={onToggleMobileSidebar}
          className="h-7 w-7 items-center justify-center rounded-md border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors flex-shrink-0"
          title="Open menu"
        >
          {!isMobileSidebarOpen ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      )}

      {/* Left: Search / Command Palette shortcut (offset by mobile button) */}
      <div className={`flex-1 min-w-[130px] ${isMobile ? 'ml-3' : ''} max-w-md`}>
        <div
          onClick={() => navigate("/copilot")}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 text-xs text-slate-400 hover:border-slate-700 hover:text-slate-300 transition-all cursor-pointer shadow-inner"
        >
          <Search className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <span className="flex-1 truncate">Ask Theta AI or search facilities, SKUs, alerts...</span>
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 rounded border border-slate-700 text-slate-400">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right: Operational Status, Emergency Action, Alerts, Profile & Switcher */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Real-time sync badge */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
          <span className="text-[11px] text-emerald-400 font-medium">Live</span>
        </div>

        {/* Emergency Mode Quick Action */}
        <Button
          variant="emergency"
          size="sm"
          onClick={() => navigate("/emergency")}
          className="text-xs h-8 px-2 min-[380px]:px-2.5 sm:px-3 shrink-0 transition-all"
        >
          <Flame className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline ml-1.5">Emergency Mode</span>
          <span className="hidden min-[380px]:inline sm:hidden ml-1.5">Emergency</span>
        </Button>

        {/* Notifications */}
        <button
          onClick={() => navigate("/command-center")}
          className="relative h-8 w-8 shrink-0 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-slate-100 hover:border-slate-700 flex items-center justify-center transition-colors"
          title="Active Alerts"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-slate-950" />
        </button>

      </div>
    </header>
  )
}