import {
  Bell,
  Search,
  Flame,
  Radio,
  Shield,
  LogOut,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/features/auth/AuthContext"

export function Header() {
  const navigate = useNavigate()
  const { currentUser, firebaseUser, logout } = useAuth()

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Search / Command Palette shortcut */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div
          onClick={() => navigate("/copilot")}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 text-xs text-slate-400 hover:border-slate-700 hover:text-slate-300 transition-all cursor-pointer shadow-inner"
        >
          <Search className="h-3.5 w-3.5 text-slate-500" />
          <span className="flex-1 truncate">Ask Theta AI or search facilities, SKUs, alerts...</span>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 rounded border border-slate-700 text-slate-400">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right: Operational Status, Emergency Action, Alerts, Profile & Switcher */}
      <div className="flex items-center gap-3">
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
          className="text-xs h-8 gap-1.5"
        >
          <Flame className="h-3.5 w-3.5" />
          <span>Emergency Mode</span>
        </Button>

        {/* Notifications */}
        <button
          onClick={() => navigate("/command-center")}
          className="relative h-8 w-8 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-slate-100 hover:border-slate-700 flex items-center justify-center transition-colors"
          title="Active Alerts"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-slate-950" />
        </button>

        <div className="h-4 w-px bg-slate-800" />

        {/* Profile Link and Role Switcher */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate("/profile")}
            className="group flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-cyan-500/50 hover:bg-slate-900 transition-all text-left"
            title="View & Edit Profile"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-600/30 to-slate-800 border border-cyan-500/30 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
              <Shield className="h-4 w-4" />
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-200">
                {currentUser.title}
              </div>
              <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{currentUser.name}</p>
            </div>
          </button>

          {firebaseUser ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await logout()
                navigate("/login")
              }}
              className="h-8 w-8 p-0 text-slate-400 hover:text-rose-500 hover:border-rose-500/50 hover:bg-rose-500/10 border border-slate-800/80 rounded-lg flex items-center justify-center transition-colors"
              title="Log Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/login")}
              className="h-8 px-2 text-[10px] text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800/80 rounded-lg"
              title="Sign In / Register Portal"
            >
              Auth
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
