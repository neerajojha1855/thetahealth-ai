import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BotMessageSquare,
  Building2,
  Calendar,
  CheckCircle2,
  Flame,
  Layers,
  Mic,
  Pill,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
  Cpu,
  RefreshCw,
  Plus,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { useRealtimeSync } from "@/hooks/useRealtimeSync"

export function CommandCenterPage() {
  const navigate = useNavigate()
  const { transactions, alerts, lastSync, isSyncing, simulateIntake } = useRealtimeSync()

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Welcome / Executive ThetaBrief Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-cyan-950/30 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="ai" className="gap-1 px-2 py-0.5">
                <Sparkles className="h-3 w-3 text-cyan-400" />
                ThetaBrief · Real-time Intelligence
              </Badge>
              <span className="text-xs text-slate-400">
                Synced {lastSync.toLocaleTimeString()}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
              National Healthcare Command Center
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Monitoring 400 healthcare facilities across 10 states. 
              <span className="text-amber-400 font-medium"> {alerts.length} active risk alerts</span> detected in Firestore state. 
              Vertex AI demand models project 
              <span className="text-cyan-400 font-medium"> 94.2% supply chain resilience</span> for the next 14-day horizon.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={() => navigate("/copilot")}
              variant="outline"
              className="gap-2 text-xs"
            >
              <BotMessageSquare className="h-4 w-4 text-cyan-400" />
              Ask Theta Copilot
            </Button>
            <Button
              onClick={() => navigate("/voice")}
              className="gap-2 text-xs"
            >
              <Mic className="h-4 w-4" />
              PHC Voice Report
            </Button>
          </div>
        </div>
      </div>

      {/* Top 4 Core Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Resilience Index */}
        <Card className="hover:border-cyan-500/40 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Network Resilience Score
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-400">94.2</span>
              <span className="text-xs text-slate-400 font-medium">/ 100</span>
              <Badge variant="success" className="ml-auto text-[10px] gap-1">
                <TrendingUp className="h-3 w-3" /> +1.4%
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Low vulnerability across all 50 districts
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Active Facilities */}
        <Card className="hover:border-cyan-500/40 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Connected Facilities
            </CardTitle>
            <Building2 className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">400</span>
              <span className="text-xs text-slate-400 font-medium">facilities</span>
              <Badge variant="default" className="ml-auto text-[10px]">
                100% Online
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              100 Hospitals · 300 PHCs
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Critical Medicine Stockouts */}
        <Card className="hover:border-amber-500/40 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Alerts ({alerts.length})
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-400">{alerts.length}</span>
              <span className="text-xs text-slate-400 font-medium">active alerts</span>
              <Badge variant="warning" className="ml-auto text-[10px]">
                Action Needed
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Redistribution recommendations ready
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Workforce Active */}
        <Card className="hover:border-cyan-500/40 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Healthcare Workforce
            </CardTitle>
            <Users className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">4,890</span>
              <span className="text-xs text-slate-400 font-medium">/ 5,000 on duty</span>
              <Badge variant="secondary" className="ml-auto text-[10px]">
                97.8% Attendance
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              0 Critical department staffing deficits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hero Workflow: Observe → Predict → Act Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Observe: Real-Time Stream */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <CardTitle className="text-sm">1. Observe (Real-Time)</CardTitle>
              </div>
              <Badge variant="secondary" className="text-[10px]">Firestore Live</Badge>
            </div>
            <CardDescription>
              Real-time telemetry stream from PHCs, Hospitals, and Warehouses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 flex-1 overflow-y-auto max-h-[340px]">
            {transactions.slice(0, 4).map((tx) => (
              <div
                key={tx.transaction_id}
                className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">
                    {tx.facility_id === "FAC-UP-MEE-002" ? "PHC Anandpur" : tx.facility_id === "FAC-UP-MEE-001" ? "District Hospital Meerut" : "Central Medical Warehouse"}
                  </span>
                  <Badge variant="outline" className="text-[9px] py-0">{tx.type}</Badge>
                </div>
                <p className="text-xs text-slate-400">
                  <span className="text-cyan-300 font-medium">{tx.quantity} {tx.unit} {tx.medicine_name}</span> ({tx.batch_number}) via {tx.source}.
                </p>
              </div>
            ))}
          </CardContent>
          <div className="p-4 pt-2 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => simulateIntake("MEDICINE_RECEIVED")}
              className="flex-1 text-xs gap-1.5 border-dashed border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
            >
              <Plus className="h-3.5 w-3.5" />
              Simulate Live Intake Event
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/facilities")}
              className="text-xs"
            >
              Digital Twin
            </Button>
          </div>
        </Card>

        {/* Predict: Vertex AI Forecasting */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <CardTitle className="text-sm">2. Predict (Vertex AI)</CardTitle>
              </div>
              <Badge variant="ai" className="text-[10px]">AutoML 14-Day</Badge>
            </div>
            <CardDescription>
              Predictive consumption curves & stockout warning horizons.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 flex-1">
            <div className="rounded-lg border border-rose-500/20 bg-rose-950/10 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-300">Doxycycline 100mg</span>
                <Badge variant="destructive" className="text-[9px]">Stockout in 2.1 Days</Badge>
              </div>
              <p className="text-xs text-slate-400">
                Projected consumption surge at PHC Rampur due to seasonal vector surge.
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Artesunate Injection</span>
                <Badge variant="warning" className="text-[9px]">Stockout in 4.5 Days</Badge>
              </div>
              <p className="text-xs text-slate-400">
                PHC Bilaspur inventory depleting 18% faster than baseline trend.
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Oxygen Cylinders (Type D)</span>
                <Badge variant="success" className="text-[9px]">Safe (18 Days)</Badge>
              </div>
              <p className="text-xs text-slate-400">
                Demand stable across all district cluster centers.
              </p>
            </div>
          </CardContent>
          <div className="p-4 pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/analytics")}
              className="w-full text-xs"
            >
              Explore Forecast Models
            </Button>
          </div>
        </Card>

        {/* Act: Resource Exchange & Human Decisions */}
        <Card className="flex flex-col border-cyan-500/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                <CardTitle className="text-sm">3. Act (Human-in-the-Loop)</CardTitle>
              </div>
              <Badge variant="default" className="text-[10px]">Decision Support</Badge>
            </div>
            <CardDescription>
              AI-generated rebalancing recommendations requiring operator approval.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 flex-1">
            <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-cyan-300">Transfer #TX-8831</span>
                <Badge variant="ai" className="text-[9px]">98% Match Confidence</Badge>
              </div>
              <p className="text-xs text-slate-300">
                Move <span className="text-white font-medium">400 Doxycycline units</span> from 
                <span className="text-emerald-400 font-medium"> District Hospital Meerut (Surplus)</span> to 
                <span className="text-rose-400 font-medium"> PHC Rampur (Deficit)</span>.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button size="sm" className="h-7 text-xs flex-1">
                  Approve Transfer
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  Details
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Supplier Expedition</span>
                <span className="text-[10px] text-amber-400">Supplier Delay +4d</span>
              </div>
              <p className="text-xs text-slate-400">
                Recommended activating regional backup distributor for ORS sachets.
              </p>
            </div>
          </CardContent>
          <div className="p-4 pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/supply-chain")}
              className="w-full text-xs"
            >
              Open Resource Exchange
            </Button>
          </div>
        </Card>
      </div>

      {/* Quick Launchpad */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-400" />
          System Modules & Operational Workspaces
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { title: "Digital Twin", icon: Layers, path: "/facilities", desc: "400 Facilities" },
            { title: "Theta Voice", icon: Mic, path: "/voice", desc: "Natural Language AI" },
            { title: "Pharmacy FEFO", icon: Pill, path: "/pharmacy", desc: "Expiry & Stock" },
            { title: "Control Tower", icon: Truck, path: "/supply-chain", desc: "Redistribution" },
            { title: "Emergency Mode", icon: Flame, path: "/emergency", desc: "Outbreak Ops" },
            { title: "What-If Simulator", icon: Cpu, path: "/simulator", desc: "Surge Modeling" },
          ].map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="group flex flex-col items-start p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-cyan-500/50 transition-all text-left"
              >
                <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-slate-200 mt-3 group-hover:text-cyan-300 transition-colors flex items-center gap-1">
                  {item.title}
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">{item.desc}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
