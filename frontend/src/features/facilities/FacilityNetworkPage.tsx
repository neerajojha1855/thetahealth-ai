import { useState, useEffect } from "react"
import { Facility, NetworkOverviewStats } from "@/types/facility"
import { facilityService } from "@/services/facilityService"
import { FacilityDetailModal } from "./FacilityDetailModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Building2,
  Search,
  Layers,
  Sparkles,
  ShieldCheck,
  Bed,
  Users,
  Pill,
  ArrowRight,
  Filter,
  AlertTriangle,
  Flame,
  Activity,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function FacilityNetworkPage() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [stats, setStats] = useState<NetworkOverviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedType, setSelectedType] = useState<string>("ALL")
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [facList, overviewStats] = await Promise.all([
        facilityService.getFacilities({
          facility_type: selectedType !== "ALL" ? selectedType : undefined,
          search: search || undefined,
        }),
        facilityService.getOverviewStats(),
      ])
      setFacilities(facList)
      setStats(overviewStats)
      setLoading(false)
    }
    loadData()
  }, [selectedType, search])

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-cyan-950/30 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="ai" className="gap-1 px-2.5 py-0.5">
                <Sparkles className="h-3 w-3 text-cyan-400" />
                Facility Network & Digital Twin
              </Badge>
              <Badge variant="success">Live</Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Layers className="h-5 w-5" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Healthcare Network Digital Twin
              </h1>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Consolidated operational telemetry spanning Country → 10 States → 50 Districts → 400 Facilities. Click any node to open its real-time Digital Twin.
            </p>
          </div>
        </div>
      </div>

      {/* Network Overview Summary Metrics */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:border-cyan-500/40 transition-all">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Facilities
              </CardTitle>
              <Building2 className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.total_facilities} <span className="text-xs font-normal text-slate-400">nodes</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {stats.total_hospitals} Hospitals · {stats.total_phcs} PHCs
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-cyan-500/40 transition-all">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Network Bed Capacity
              </CardTitle>
              <Bed className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.total_beds_occupied}{" "}
                <span className="text-xs font-normal text-slate-400">/ {stats.total_beds} beds</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-[10px]">
                  {stats.average_occupancy_rate}% Occupancy
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-cyan-500/40 transition-all">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Resilience Average
              </CardTitle>
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-emerald-400">
                  {stats.average_resilience_score}
                </span>
                <span className="text-xs text-slate-400">/ 100</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Low system-wide vulnerability
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-amber-500/40 transition-all">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Critical Alert Flags
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-400">
                {stats.facilities_with_stockout_risk}{" "}
                <span className="text-xs font-normal text-slate-400">facilities flagged</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {stats.facilities_in_emergency} facilities in surge mode
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl backdrop-blur-md">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search facility name, district, state, or facility code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-950/80 text-xs h-9"
          />
        </div>

        {/* Type Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {[
            { label: "All Nodes", value: "ALL" },
            { label: "Hospitals", value: "HOSPITAL" },
            { label: "PHCs", value: "PHC" },
            { label: "Warehouses", value: "WAREHOUSE" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedType(tab.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                selectedType === tab.value
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Facility Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          Loading digital twin telemetry...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {facilities.map((fac) => {
            const dt = fac.digital_twin
            const totBeds = dt.beds.general_total + dt.beds.icu_total + dt.beds.emergency_total
            const occBeds = dt.beds.general_occupied + dt.beds.icu_occupied + dt.beds.emergency_occupied
            const bedPercent = totBeds > 0 ? Math.round((occBeds / totBeds) * 100) : 0

            return (
              <Card
                key={fac.id}
                onClick={() => setSelectedFacility(fac)}
                className="group cursor-pointer hover:border-cyan-500/50 hover:bg-slate-900/90 transition-all relative overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  {/* Top line: Type & Status */}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                      {fac.type} · {fac.code}
                    </Badge>
                    <Badge
                      variant={
                        fac.status === "EMERGENCY"
                          ? "destructive"
                          : fac.status === "SURGE"
                          ? "warning"
                          : "success"
                      }
                      className="text-[10px]"
                    >
                      {fac.status}
                    </Badge>
                  </div>

                  {/* Title & Region */}
                  <div>
                    <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors">
                      {fac.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {fac.district_name}, {fac.state_name}
                    </p>
                  </div>

                  {/* Telemetry Snapshot */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Resilience</span>
                      <span
                        className={cn(
                          "text-sm font-bold",
                          dt.resilience_score >= 85
                            ? "text-emerald-400"
                            : dt.resilience_score >= 70
                            ? "text-amber-400"
                            : "text-rose-400"
                        )}
                      >
                        {dt.resilience_score}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Beds</span>
                      <span className="text-sm font-semibold text-slate-200">
                        {totBeds > 0 ? `${bedPercent}%` : "N/A"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Stockouts</span>
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          dt.inventory.critical_stockouts_count > 0
                            ? "text-rose-400"
                            : "text-emerald-400"
                        )}
                      >
                        {dt.inventory.critical_stockouts_count}
                      </span>
                    </div>
                  </div>

                  {/* Footer link */}
                  <div className="flex items-center justify-between text-xs text-cyan-400 font-medium pt-1">
                    <span>Inspect Digital Twin</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Digital Twin Modal */}
      <FacilityDetailModal
        facility={selectedFacility}
        onClose={() => setSelectedFacility(null)}
      />
    </div>
  )
}
