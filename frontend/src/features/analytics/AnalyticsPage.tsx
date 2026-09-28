import { useState, useEffect } from "react"
import { MedicineForecast, BedDemandForecast, AnalyticsOverview } from "@/types/analytics"
import { analyticsService } from "@/services/analyticsService"
import { ForecastChart } from "./ForecastChart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  BarChart3,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Clock,
  Layers,
  Bed,
  Activity,
  ShieldCheck,
  Calendar,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

const MEDICINE_OPTIONS = [
  { id: "MED-DOX-100", label: "Doxycycline 100mg", facility: "PHC Rampur", hasAnomaly: true },
  { id: "MED-PCM-500", label: "Paracetamol 500mg", facility: "PHC Anandpur", hasAnomaly: false },
  { id: "MED-ART-60", label: "Artesunate 60mg", facility: "PHC Rampur", hasAnomaly: false },
  { id: "MED-IVF-NS", label: "Normal Saline IV", facility: "District Hospital Meerut", hasAnomaly: false },
]

export function AnalyticsPage() {
  const [horizon, setHorizon] = useState<number>(14)
  const [selectedMedId, setSelectedMedId] = useState<string>("MED-DOX-100")
  const [forecast, setForecast] = useState<MedicineForecast | null>(null)
  const [bedForecast, setBedForecast] = useState<BedDemandForecast | null>(null)
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [fData, bData, oData] = await Promise.all([
        analyticsService.getMedicineForecast(selectedMedId, undefined, horizon),
        analyticsService.getBedForecast(),
        analyticsService.getOverview(),
      ])
      setForecast(fData)
      setBedForecast(bData)
      setOverview(oData)
      setLoading(false)
    }
    loadData()
  }, [selectedMedId, horizon])

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-cyan-950/30 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="ai" className="gap-1 px-2.5 py-0.5">
                <Sparkles className="h-3 w-3 text-cyan-400" />
                BigQuery Analytics & Vertex AI AutoML
              </Badge>
              <Badge variant="success">Vertex AI Model v2.4 Active</Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Predictive Medicine & Bed Demand Forecasting
              </h1>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Vertex AI AutoML time-series models trained on multi-year BigQuery consumption lakes, disease vector seasonality, and facility footfall to generate 7, 14, and 30-day anticipatory demand curves.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Overview */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:border-cyan-500/40 transition-all">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Model Forecast Accuracy
              </CardTitle>
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-emerald-400">{overview.model_accuracy_pct}%</span>
                <span className="text-xs text-slate-400">MAPE: 5.8%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Vertex AI AutoML Model Registry</p>
            </CardContent>
          </Card>

          <Card className="hover:border-cyan-500/40 transition-all">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Predicted Network Demand (14d)
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {overview.predicted_demand_next_14d.toLocaleString()}{" "}
                <span className="text-xs font-normal text-slate-400">units</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">+14.2% seasonal vector surge</p>
            </CardContent>
          </Card>

          <Card className="hover:border-rose-500/40 transition-all">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Stockout Countdown Horizon
              </CardTitle>
              <Clock className="h-4 w-4 text-rose-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-400">
                {forecast ? `${forecast.days_until_stockout} Days` : "..."}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {forecast?.predicted_stockout_date ? `Predicted: ${forecast.predicted_stockout_date}` : "Inventory Stable"}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-amber-500/40 transition-all">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active Outbreak Anomalies
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-400">
                {overview.active_anomalies_count}{" "}
                <span className="text-xs font-normal text-slate-400">anomaly cluster</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Dengue surge in Meerut District</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Interactive Forecast Horizon and SKU Selector */}
      <Card className="border-slate-800 bg-slate-900/90">
        <CardHeader className="pb-3 border-b border-slate-800/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="ai" className="text-[10px]">
                  <Sparkles className="h-3 w-3 mr-1" /> Vertex AI Time-Series AutoML
                </Badge>
                {forecast?.anomaly_detected && (
                  <Badge variant="destructive" className="text-[10px] animate-pulse">
                    Outbreak Anomaly Detected
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg text-white">
                {forecast?.medicine_name} — {forecast?.facility_name}
              </CardTitle>
              <CardDescription className="text-xs">
                Historical BigQuery consumption curve (solid) vs. AutoML 14-day forecast with P10/P90 confidence envelope (dashed).
              </CardDescription>
            </div>

            {/* Horizon Selector */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[7, 14, 30].map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    horizon === h
                      ? "bg-cyan-500 text-slate-950 shadow-md font-bold"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {h}-Day Horizon
                </button>
              ))}
            </div>
          </div>

          {/* SKU Pill Selector */}
          <div className="flex flex-wrap items-center gap-2 pt-3">
            {MEDICINE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedMedId(opt.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 border",
                  selectedMedId === opt.id
                    ? "border-cyan-400 bg-cyan-950/40 text-cyan-300 font-bold shadow-sm"
                    : "border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                )}
              >
                <span>{opt.label}</span>
                <span className="text-[10px] text-slate-500">({opt.facility})</span>
                {opt.hasAnomaly && (
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Anomaly Explanation Alert (If Any) */}
          {forecast?.anomaly_detected && forecast.anomaly_reason && (
            <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/20 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-rose-300">Vertex AI Anomaly Explanation:</span>
                <p className="text-slate-300 leading-relaxed">{forecast.anomaly_reason}</p>
              </div>
            </div>
          )}

          {/* SVG Forecast Chart */}
          {loading || !forecast ? (
            <div className="text-center py-16 text-xs text-slate-400">Generating prediction trajectories...</div>
          ) : (
            <ForecastChart
              historicalPoints={forecast.historical_points}
              forecastPoints={forecast.forecast_points}
              currentStock={forecast.current_stock}
            />
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-4 bg-cyan-400" />
              <span>Historical Actual (BigQuery)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-4 bg-indigo-400 border-dashed border-t-2" />
              <span>AutoML P50 Prediction</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-4 bg-indigo-500/30 border border-indigo-400/40 rounded" />
              <span>P10 - P90 Confidence Band</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 72-Hour Bed & ICU Forecast + Category Growth Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bed & ICU Capacity Forecast */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bed className="h-4 w-4 text-cyan-400" />
                <CardTitle className="text-sm">72-Hour Clinical Bed & ICU Forecast</CardTitle>
              </div>
              <Badge variant="warning" className="text-[10px]">
                {bedForecast?.icu_saturation_risk_pct}% ICU Risk
              </Badge>
            </div>
            <CardDescription>
              Predictive bed occupancy trajectory for District Hospital Meerut.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {bedForecast?.points.slice(0, 6).map((pt, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-semibold text-white">{pt.timestamp}</span>
                  <div className="text-[11px] text-slate-400">
                    General: <span className="text-slate-200">{pt.general_beds_demand}</span> · Emergency: <span className="text-slate-200">{pt.emergency_beds_demand}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-amber-400">
                    ICU: {pt.icu_beds_demand} beds
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Surge Risk: {Math.round(pt.surge_risk_score * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* BigQuery Category Growth Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-400" />
                <CardTitle className="text-sm">BigQuery Therapeutic Category Trends</CardTitle>
              </div>
              <Badge variant="secondary" className="text-[10px]">365-Day Historical</Badge>
            </div>
            <CardDescription>
              30-day consumption velocity and seasonal surge multipliers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-800/80">
              {overview?.categories_trend.map((cat) => (
                <div key={cat.category} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white">{cat.category}</span>
                    <span className="text-[10px] text-slate-400 block">
                      30-Day Volume: {cat.total_consumed_30d.toLocaleString()} units
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={cn(
                        "font-bold",
                        cat.growth_rate_pct > 15
                          ? "text-rose-400"
                          : cat.growth_rate_pct > 0
                          ? "text-cyan-300"
                          : "text-slate-400"
                      )}
                    >
                      {cat.growth_rate_pct > 0 ? `+${cat.growth_rate_pct}%` : `${cat.growth_rate_pct}%`}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Seasonal Mult: {cat.seasonal_multiplier}x
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
