import { useAuth, RoleType } from "@/features/auth/AuthContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Shield,
  KeyRound,
  Building2,
  Sparkles,
  Lock,
} from "lucide-react"

export function SettingsPage() {
  const { currentUser } = useAuth()

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-6 md:p-8 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="ai" className="gap-1 px-2.5 py-0.5">
                <Sparkles className="h-3 w-3 text-cyan-400" />
                Security & RBAC Governance
              </Badge>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Shield className="h-5 w-5" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Authentication & Role-Based Access Control
              </h1>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              FastAPI backend enforces JWT & Firebase ID token validation with strict role boundaries across 9 operational healthcare tiers.
            </p>
          </div>
        </div>
      </div>

      {/* Current User Session Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-cyan-500/30 bg-gradient-to-br from-slate-900/90 to-cyan-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Persona
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xl font-bold text-white">{currentUser.title}</div>
            <p className="text-xs text-slate-300 font-medium">{currentUser.name}</p>
            <p className="text-[11px] text-slate-400 font-mono">{currentUser.email || "No Email Provided"}</p>
            <Badge variant="ai" className="mt-2 text-[10px]">
              Active Role: {currentUser.role}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Operational Scope
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              {currentUser.facilityName || currentUser.districtName || "National Network"}
            </div>
            <p className="text-xs text-slate-400">{currentUser.scope}</p>
            <div className="pt-2">
              <span className="text-[10px] text-emerald-400 font-medium">
                ● Authorization Bound to Backend Endpoints
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm font-semibold text-white flex items-center gap-1.5">
              <KeyRound className="h-4 w-4 text-emerald-400" />
              
            </div>
            <p className="text-xs text-slate-400">
               <span className="font-mono text-slate-300"></span>
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Badge variant="secondary" className="text-[10px]"></Badge>
              <Badge variant="secondary" className="text-[10px]"></Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
