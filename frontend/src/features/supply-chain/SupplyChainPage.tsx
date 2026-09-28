import { useState, useEffect } from "react"
import { SupplyChainSummary } from "@/types/supplyChain"
import { supplyChainService } from "@/services/supplyChainService"
import { TransferApprovalCard } from "./TransferApprovalCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Truck,
  Sparkles,
  Building2,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Layers,
  MapPin,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  Boxes,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function SupplyChainPage() {
  const [summary, setSummary] = useState<SupplyChainSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    const data = await supplyChainService.getSummary()
    setSummary(data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-cyan-950/30 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="ai" className="gap-1 px-2.5 py-0.5">
                <Sparkles className="h-3 w-3 text-cyan-400" />
                Supply Chain Control Tower & Resource Exchange
              </Badge>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Truck className="h-5 w-5" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Supply Chain Control Tower & Resource Exchange
              </h1>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Multi-tier visibility from Pharmaceutical Suppliers → Central Warehouses → District Depots → Hospitals → PHCs. AI identifies inventory imbalances and coordinates proactive inter-facility rebalancing.
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Tier Pipeline Flow Diagram */}
      <Card className="border-slate-800 bg-slate-950/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Healthcare Supply Chain Hierarchy Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 py-2 text-center">
            {[
              { title: "Suppliers", count: "12 Plants", sub: "Active SLAs", color: "text-slate-300" },
              { title: "Warehouses", count: "15 Hubs", sub: "Regional Stores", color: "text-indigo-400" },
              { title: "District Depots", count: "50 Depots", sub: "District Stock", color: "text-cyan-400" },
              { title: "Hospitals", count: "100 Nodes", sub: "Tertiary Care", color: "text-emerald-400" },
              { title: "PHCs", count: "300 Centers", sub: "Frontline Care", color: "text-amber-400" },
            ].map((tier, i) => (
              <div
                key={tier.title}
                className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/60 relative flex flex-col items-center justify-center space-y-1"
              >
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                  Tier {i + 1}
                </span>
                <span className={cn("text-base font-bold", tier.color)}>{tier.title}</span>
                <span className="text-xs font-bold text-white">{tier.count}</span>
                <span className="text-[10px] text-slate-400">{tier.sub}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPI Overview */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:border-cyan-500/40 transition-all">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Pending AI Transfers
              </CardTitle>
              <Sparkles className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-300">
                {summary.pending_recommendations_count}{" "}
                <span className="text-xs font-normal text-slate-400">proposals ready</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Awaiting human operator approval</p>
            </CardContent>
          </Card>

          <Card className="hover:border-cyan-500/40 transition-all">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active In-Transit Shipments
              </CardTitle>
              <Truck className="h-4 w-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {summary.total_shipments_in_transit}{" "}
                <span className="text-xs font-normal text-slate-400">convoys live</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Northern logistics corridor clear</p>
            </CardContent>
          </Card>

          <Card className="hover:border-emerald-500/40 transition-all">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Surplus Donor Facilities
              </CardTitle>
              <Building2 className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">
                {summary.surplus_nodes_count}{" "}
                <span className="text-xs font-normal text-slate-400">facilities</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Available buffer for redistribution</p>
            </CardContent>
          </Card>

          <Card className="hover:border-rose-500/40 transition-all">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Deficit Recipient Facilities
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-400">
                {summary.deficit_nodes_count}{" "}
                <span className="text-xs font-normal text-slate-400">facility</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Targeted rebalancing in progress</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resource Exchange Transfer Recommendations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            Theta Resource Exchange — AI Redistribution Recommendations
          </h2>
          <Badge variant="secondary">Decision Support Only · Requires Human Approval</Badge>
        </div>

        {loading || !summary ? (
          <div className="text-center py-12 text-xs text-slate-400">Loading recommendations...</div>
        ) : (
          <div className="space-y-4">
            {summary.recommendations.map((rec) => (
              <TransferApprovalCard
                key={rec.recommendation_id}
                recommendation={rec}
                onActionComplete={loadData}
              />
            ))}
          </div>
        )}
      </div>

      {/* In-Transit Shipments & Facility Balance Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Active Shipments */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-cyan-400" />
                <CardTitle className="text-sm">Active Logistics & Dispatch Feed</CardTitle>
              </div>
              <Badge variant="secondary" className="text-[10px]">Real-Time GPS</Badge>
            </div>
            <CardDescription>Live telemetry from regional distribution shipments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary?.shipments.map((shp) => (
              <div
                key={shp.shipment_id}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Boxes className="h-3.5 w-3.5 text-cyan-400" />
                    {shp.medicine_name} ({shp.quantity} {shp.unit})
                  </span>
                  <Badge
                    variant={shp.status === "DELAYED" ? "warning" : "success"}
                    className="text-[10px]"
                  >
                    {shp.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                  <span>{shp.origin_name}</span>
                  <ArrowRight className="h-3 w-3 text-cyan-400 shrink-0" />
                  <span className="font-medium text-slate-200">{shp.destination_name}</span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>ETA: <strong className="text-white">{shp.eta}</strong></span>
                  <span>Carrier: {shp.carrier_name}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Facility Resource Balance Heatmap */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-400" />
                <CardTitle className="text-sm">Facility Resource Balance Matrix</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px]">400 Nodes</Badge>
            </div>
            <CardDescription>Automated classification of network inventory postures.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {summary?.facility_balances.map((fac) => (
              <div
                key={fac.facility_id}
                className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    {fac.facility_name}
                    <span className="text-[10px] text-slate-500 font-mono">({fac.facility_type})</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {fac.district_name}, {fac.state_name}
                  </div>
                </div>

                <div className="text-right flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200">
                    Score: {fac.resilience_score}
                  </span>
                  <Badge
                    variant={
                      fac.balance_status === "SURPLUS"
                        ? "success"
                        : fac.balance_status === "NEEDS_RESOURCE"
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-[10px]"
                  >
                    {fac.balance_status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
