import { useState, useRef } from "react"
import { voiceService } from "@/services/voiceService"
import { ParsedReportResponse, VoiceCommitResult } from "@/types/voice"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Mic,
  MicOff,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Volume2,
  Activity,
  Flame,
  Pill,
  UserCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"

const VOICE_PRESETS = [
  {
    label: "Receipt: Paracetamol 500mg (150 vials)",
    transcript: "We received 150 vials of Paracetamol 500mg batch PCM-2026-B8 from Cipla supplier",
    icon: Pill,
  },
  {
    label: "Consumption: Normal Saline IV (40 bottles)",
    transcript: "Consumed 40 bottles of Normal Saline 0.9% IV in emergency triage ward",
    icon: Activity,
  },
  {
    label: "Check-in: Dr. Priya Patel (OPD Shift)",
    transcript: "Dr. Priya Patel checked in for morning shift duty in OPD department",
    icon: UserCheck,
  },
  {
    label: "Emergency: Dengue Vector Outbreak (18 cases)",
    transcript: "Emergency outbreak alert: 18 new dengue fever patients admitted and general beds filled",
    icon: Flame,
  },
  {
    label: "Ambiguity Test: Unspecified Paracetamol",
    transcript: "Received 50 packs of Paracetamol at reception",
    icon: HelpCircle,
  },
]

export function ThetaVoicePage() {
  const [transcript, setTranscript] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [parsedResult, setParsedResult] = useState<ParsedReportResponse | null>(null)
  const [isCommitting, setIsCommitting] = useState(false)
  const [commitResult, setCommitResult] = useState<VoiceCommitResult | null>(null)
  const [clarificationChoice, setClarificationChoice] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  const handleStartRecording = () => {
    setIsRecording(true)
    setCommitResult(null)
    setTranscript("")

    // Check for browser Speech Recognition API
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition
      recognition.lang = "en-IN"
      recognition.continuous = true
      recognition.interimResults = true

      let finalTranscript = ""

      recognition.onresult = (event: any) => {
        let interimTranscript = ""
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " "
          } else {
            interimTranscript += event.results[i][0].transcript
          }
        }
        setTranscript(finalTranscript + interimTranscript)
      }

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognition.start()
    } else {
      // Fallback timer simulation
      setTimeout(() => {
        const fallbackText = "We received 150 vials of Paracetamol 500mg batch PCM-2026-B8"
        setTranscript(fallbackText)
        setIsRecording(false)
        handleParse(fallbackText)
      }, 2500)
    }
  }

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsRecording(false)
  }

  const handleParse = async (textToParse?: string) => {
    const text = textToParse || transcript
    if (!text.trim()) return

    setIsParsing(true)
    setCommitResult(null)
    setClarificationChoice(null)
    try {
      const result = await voiceService.parseVoiceReport(text)
      setParsedResult(result)
    } finally {
      setIsParsing(false)
    }
  }

  const handleConfirmCommit = async () => {
    if (!parsedResult) return

    setIsCommitting(true)
    try {
      const payloadEntities: Record<string, any> = {}
      Object.entries(parsedResult.entities).forEach(([k, v]) => {
        payloadEntities[k] = v.value
      })

      if (clarificationChoice) {
        payloadEntities["medicine_name"] = clarificationChoice
      }

      const res = await voiceService.confirmAndCommit({
        facility_id: "FAC-UP-MEE-002",
        intent: parsedResult.intent,
        entities: payloadEntities,
        notes: `Extracted from voice transcript: "${parsedResult.raw_transcript}"`,
      })
      setCommitResult(res)
    } finally {
      setIsCommitting(false)
    }
  }

  const handleReset = () => {
    setTranscript("")
    setParsedResult(null)
    setCommitResult(null)
    setClarificationChoice(null)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-cyan-950/30 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="ai" className="gap-1 px-2.5 py-0.5">
                <Sparkles className="h-3 w-3 text-cyan-400" />
                Theta Voice & Gemini Extraction
              </Badge>
              <Badge variant="success">Zero Complex Forms</Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Mic className="h-5 w-5" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Theta Voice Frontline Reporting
              </h1>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Designed for frontline PHC workers. Speak naturally in plain language. Audio is converted into structured, validated JSON with confidence scores and mandatory human confirmation.
            </p>
          </div>
        </div>
      </div>

      {/* Voice Input Station */}
      <Card className="border-slate-800 bg-slate-950/80">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-base">Speak Your Operational Report</CardTitle>
          <CardDescription>
            Tap the microphone to speak or select a demo voice scenario chip below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 flex flex-col items-center">
          {/* Big Microphone Recording Orb */}
          <div className="relative flex items-center justify-center py-4">
            {isRecording && (
              <>
                <div className="absolute h-32 w-32 rounded-full bg-cyan-500/20 animate-ping" />
                <div className="absolute h-24 w-24 rounded-full bg-cyan-500/30 animate-pulse" />
              </>
            )}
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={cn(
                "relative z-10 h-20 w-20 rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-95",
                isRecording
                  ? "bg-rose-600 text-white ring-4 ring-rose-500/40"
                  : "bg-gradient-to-tr from-cyan-600 to-teal-500 text-white hover:scale-105 ring-4 ring-cyan-500/20 shadow-cyan-500/30"
              )}
            >
              {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
            </button>
          </div>

          {isRecording && (
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold animate-pulse">
              <Volume2 className="h-4 w-4" />
              <span>Listening... Speak now (English / Hindi)...</span>
            </div>
          )}

          {/* Transcript input bar */}
          <div className="w-full max-w-2xl flex items-center gap-2">
            <Input
              placeholder="Or type what you would say: e.g. Received 150 vials of Paracetamol..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="bg-slate-900/90 text-xs h-10 flex-1"
            />
            <Button
              onClick={() => handleParse()}
              disabled={isParsing || !transcript.trim()}
              className="h-10 text-xs gap-1.5 px-4"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isParsing ? "Extracting..." : "Parse with AI"}
            </Button>
          </div>

          {/* Quick Voice Preset Chips */}
          <div className="w-full space-y-2 pt-2 border-t border-slate-800/80">
            <span className="text-xs font-semibold text-slate-400">
              Demo Test Voice Scenarios:
            </span>
            <div className="flex flex-wrap gap-2">
              {VOICE_PRESETS.map((preset, idx) => {
                const Icon = preset.icon
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setTranscript(preset.transcript)
                      handleParse(preset.transcript)
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-cyan-500/50 hover:bg-slate-900 text-xs text-slate-300 transition-all text-left"
                  >
                    <Icon className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>{preset.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extracted Structured JSON & Human Confirmation */}
      {parsedResult && (
        <Card className="border-cyan-500/30 bg-slate-900/80 animate-in fade-in-50 duration-300">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="ai" className="text-xs gap-1">
                    <Sparkles className="h-3 w-3" />
                    Gemini Extraction Result
                  </Badge>
                  <Badge
                    variant={
                      parsedResult.overall_confidence >= 0.90
                        ? "success"
                        : parsedResult.overall_confidence >= 0.70
                        ? "warning"
                        : "destructive"
                    }
                    className="text-xs font-bold"
                  >
                    {Math.round(parsedResult.overall_confidence * 100)}% Confidence
                  </Badge>
                </div>
                <CardTitle className="text-base text-white flex items-center gap-2">
                  Intent: <span className="text-cyan-300 font-mono">{parsedResult.intent}</span>
                </CardTitle>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-xs gap-1 h-8"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Suggested Action */}
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400">
                  Recommended Action
                </span>
                <p className="text-xs font-medium text-white">
                  {parsedResult.suggested_action}
                </p>
              </div>
            </div>

            {/* Theta Clarify Section (If Ambiguous) */}
            {parsedResult.needs_clarification && (
              <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-950/20 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Theta Clarify · Ambiguity Detected</span>
                </div>
                <p className="text-xs text-slate-200">
                  {parsedResult.clarification_question}
                </p>
                {parsedResult.clarification_options && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {parsedResult.clarification_options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => setClarificationChoice(opt)}
                        className={cn(
                          "p-2.5 rounded-lg border text-xs font-medium text-left transition-all",
                          clarificationChoice === opt
                            ? "border-cyan-400 bg-cyan-950/40 text-cyan-300 font-bold"
                            : "border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-900"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Extracted Fields Table with Per-Field Confidence */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300">
                Extracted Field Values & Confidence Scores
              </span>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 divide-y divide-slate-800/80 text-xs">
                {Object.entries(parsedResult.entities).map(([fieldName, entity]) => (
                  <div
                    key={fieldName}
                    className="p-3 flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-mono text-slate-400 capitalize">
                        {fieldName.replace("_", " ")}
                      </span>
                      <div className="text-sm font-bold text-white">
                        {fieldName === "medicine_name" && clarificationChoice
                          ? clarificationChoice
                          : String(entity.value)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">AI Confidence:</span>
                      <Badge
                        variant={
                          entity.confidence >= 0.90
                            ? "success"
                            : entity.confidence >= 0.70
                            ? "warning"
                            : "destructive"
                        }
                        className="text-[10px]"
                      >
                        {Math.round(entity.confidence * 100)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mandatory Human Confirmation Card */}
            {commitResult ? (
              <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 text-center space-y-2">
                <div className="h-10 w-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Report Committed to Firestore State
                </h3>
                <p className="text-xs text-slate-300">{commitResult.message}</p>
                <span className="text-[10px] font-mono text-cyan-300 block">
                  Transaction ID: {commitResult.transaction_id}
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>
                    Human Verification: Confirming writes these structured facts directly to Firestore.
                  </span>
                </div>

                <Button
                  onClick={handleConfirmCommit}
                  disabled={isCommitting || (parsedResult.needs_clarification && !clarificationChoice)}
                  className="text-xs gap-1.5 shrink-0"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isCommitting ? "Committing to Firestore..." : "Confirm & Commit to Firestore"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
