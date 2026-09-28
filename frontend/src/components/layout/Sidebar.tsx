import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  Activity,
  Mic,
  Pill,
  Truck,
  Flame,
  Cpu,
  BotMessageSquare,
  BarChart3,
  Settings,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  badgeVariant?: "default" | "warning" | "destructive" | "ai"
}

const navItems: NavItem[] = [
  {
    title: "Command Center",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Facility Network",
    href: "/facilities",
    icon: Layers,
    badge: "400 PHCs",
  },
  {
    title: "Theta Voice",
    href: "/voice",
    icon: Mic,
    badge: "PHC AI",
    badgeVariant: "ai",
  },
  {
    title: "Pharmacy & Stock",
    href: "/pharmacy",
    icon: Pill,
  },
  {
    title: "Supply Chain",
    href: "/supply-chain",
    icon: Truck,
  },
  {
    title: "Emergency Mode",
    href: "/emergency",
    icon: Flame,
    badge: "LIVE",
    badgeVariant: "destructive",
  },
  {
    title: "What-If Simulator",
    href: "/simulator",
    icon: Cpu,
  },
  {
    title: "Ask Theta AI",
    href: "/copilot",
    icon: BotMessageSquare,
    badge: "Gemini",
    badgeVariant: "ai",
  },
  {
    title: "Analytics & Forecasts",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings & RBAC",
    href: "/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-slate-800/80 bg-slate-950/90 backdrop-blur-xl transition-all duration-300 z-30",
        collapsed ? "w-18" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/80">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-100 tracking-tight text-base">
                  THETA<span className="text-cyan-400">HEALTH</span>
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                Resilience Engine
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center shadow-md">
            <Activity className="h-5 w-5 text-white" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-md border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Nav list */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all",
                  isActive
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10 font-semibold"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                )
              }
              title={collapsed ? item.title : undefined}
            >
              <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
              {!collapsed && (
                <div className="flex flex-1 items-center justify-between">
                  <span className="truncate">{item.title}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                        item.badgeVariant === "destructive" &&
                          "bg-rose-500/20 text-rose-400 border border-rose-500/30",
                        item.badgeVariant === "ai" &&
                          "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
                        (!item.badgeVariant || item.badgeVariant === "default") &&
                          "bg-slate-800 text-slate-400"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          )
        })}
      </div>

      {/* Security & System Info Footer */}
      {!collapsed ? (
        <div className="p-3 m-3 rounded-xl border border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Operational Integrity</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Decision-Support Active
          </p>
        </div>
      ) : null}
    </aside>
  )
}
