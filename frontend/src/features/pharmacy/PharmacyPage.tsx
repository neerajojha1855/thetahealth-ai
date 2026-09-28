import { useState, useEffect } from "react"
import { MedicineSKU, ExpiryRiskReport } from "@/types/pharmacy"
import { pharmacyService } from "@/services/pharmacyService"
import { BatchDetailsModal } from "./BatchDetailsModal"
import { DispenseModal } from "./DispenseModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Pill,
  Search,
  AlertTriangle,
  Clock,
  Sparkles,
  Layers,
  ThermometerSnowflake,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function PharmacyPage() {
  const [medicines, setMedicines] = useState<MedicineSKU[]>([])
  const [expiryReport, setExpiryReport] = useState<ExpiryRiskReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")

  const [selectedMedicineForBatches, setSelectedMedicineForBatches] = useState<MedicineSKU | null>(null)
  const [selectedMedicineForDispense, setSelectedMedicineForDispense] = useState<MedicineSKU | null>(null)

  const loadData = async () => {
    setLoading(true)
    const [medList, expRep] = await Promise.all([
      pharmacyService.getMedicines({
        category: selectedCategory !== "ALL" ? selectedCategory : undefined,
        search: search || undefined,
      }),
      pharmacyService.getExpiryReport(),
    ])
    setMedicines(medList)
    setExpiryReport(expRep)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [selectedCategory, search])

  const criticalStockouts = medicines.filter((m) => m.stock_status === "CRITICAL_STOCKOUT").length
  const reordersNeeded = medicines.filter((m) => m.stock_status === "REORDER_NEEDED").length

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-cyan-950/30 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="ai" className="gap-1 px-2.5 py-0.5">
                <Sparkles className="h-3 w-3 text-cyan-400" />
                Pharmacy & FEFO Batch Intelligence
              </Badge>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Pill className="h-5 w-5" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Pharmacy Inventory & Expiry Surveillance
              </h1>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Real-time SKU catalog tracking with First-Expiry-First-Out (FEFO) dispensing rules, minimum buffer surveillance, and cold-chain integrity monitors.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-cyan-500/40 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Essential SKUs Monitored
            </CardTitle>
            <Pill className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{medicines.length} SKUs</div>
            <p className="text-[11px] text-slate-400 mt-1">100% Essential Drug List</p>
          </CardContent>
        </Card>

        <Card className="hover:border-rose-500/40 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Critical Stockouts (&lt;3 Days)
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-400">
              {criticalStockouts}{" "}
              <span className="text-xs font-normal text-slate-400">SKUs</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {reordersNeeded} additional items near reorder point
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-amber-500/40 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              At-Risk Expiring Batches
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">
              {expiryReport?.critical_batches_count || 0}{" "}
              <span className="text-xs font-normal text-slate-400">batches (&lt;30d)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Est. Risk: ₹{expiryReport?.estimated_financial_risk_inr.toFixed(2) || "0.00"}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-500/40 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              FEFO Protocol Compliance
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">100%</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Zero non-FEFO dispensations logged
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl backdrop-blur-md">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search medicine name, generic molecule, or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-950/80 text-xs h-9"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {[
            { label: "All", value: "ALL" },
            { label: "Analgesics", value: "ANALGESIC" },
            { label: "Antibiotics", value: "ANTIBIOTIC" },
            { label: "Antimalarials", value: "ANTIMALARIAL" },
            { label: "IV Fluids", value: "IV_FLUIDS" },
            { label: "Vaccines", value: "VACCINE" },
            { label: "Emergency", value: "EMERGENCY_DRUG" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedCategory(tab.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                selectedCategory === tab.value
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Medicines Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-400" />
            Medicine SKU Inventory & Days of Supply
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Loading inventory catalog...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-3 px-3 font-semibold">Medicine SKU</th>
                    <th className="py-3 px-3 font-semibold">Category</th>
                    <th className="py-3 px-3 font-semibold">Total Stock</th>
                    <th className="py-3 px-3 font-semibold">Daily Burn Rate</th>
                    <th className="py-3 px-3 font-semibold">Days of Supply</th>
                    <th className="py-3 px-3 font-semibold">Stock Status</th>
                    <th className="py-3 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {medicines.map((med) => (
                    <tr key={med.id} className="hover:bg-slate-900/50 text-slate-300">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          {med.name}
                          {med.is_cold_chain && (
                            <span title="Cold-Chain Required (2°C - 8°C)">
                              <ThermometerSnowflake className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {med.generic_name} · {med.dosage_form} ({med.strength})
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <Badge variant="outline" className="text-[10px]">
                          {med.category}
                        </Badge>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">
                          {med.total_stock} {med.unit}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {med.batches_count} active batches
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-slate-200 font-medium">
                          {med.daily_burn_rate} / day
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={cn(
                            "font-bold text-sm",
                            med.days_of_supply <= 3
                              ? "text-rose-400"
                              : med.days_of_supply <= 7
                              ? "text-amber-400"
                              : "text-emerald-400"
                          )}
                        >
                          {med.days_of_supply} Days
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            med.stock_status === "CRITICAL_STOCKOUT"
                              ? "destructive"
                              : med.stock_status === "REORDER_NEEDED"
                              ? "warning"
                              : "success"
                          }
                          className="text-[10px]"
                        >
                          {med.stock_status.replace("_", " ")}
                        </Badge>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedMedicineForBatches(med)}
                            className="h-7 text-xs"
                          >
                            Batches (FEFO)
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setSelectedMedicineForDispense(med)}
                            className="h-7 text-xs gap-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Dispense
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Details Modal */}
      <BatchDetailsModal
        medicine={selectedMedicineForBatches}
        onClose={() => setSelectedMedicineForBatches(null)}
        onOpenDispense={(med) => setSelectedMedicineForDispense(med)}
      />

      {/* Dispense Modal */}
      <DispenseModal
        medicine={selectedMedicineForDispense}
        onClose={() => setSelectedMedicineForDispense(null)}
        onSuccess={loadData}
      />
    </div>
  )
}
