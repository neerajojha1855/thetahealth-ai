import { useState, useRef, useEffect } from "react"
import {
  Sparkles,
  Send,
  Bot,
  User,
  ShieldCheck,
  Database,
  ArrowUpRight,
  RefreshCw,
  HelpCircle,
  Flame,
  Truck,
  Building2,
  Pill,
  BarChart3,
  Activity
} from "lucide-react"
import { copilotService } from "@/services/copilotService"
import { ChatMessage, CopilotQueryResponse } from "@/types/copilot"
import { Link } from "react-router-dom"
import ReactMarkdown from "react-markdown"
const QUICK_PROMPTS = [
  "Summarize Dengue outbreak surge status in Ernakulam",
  "Which facilities face imminent stockouts in the next 5 days?",
  "Show bed occupancy breakdown for District Hospital Ernakulam",
  "Are there any pending inter-facility supply transfers?"
]

export function CopilotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "copilot",
      text: "Hello, I am **Ask Theta AI**, your clinical and logistics intelligence copilot. I am grounded in live Firestore operational telemetry, FEFO batch data, and Vertex AI predictive forecasts.\n\nHow can I assist your health network operations today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      responsePayload: {
        query: "init",
        answer: "",
        confidence_score: 0.99,
        citations: [
          {
            source_type: "FIRESTORE_OPERATIONAL",
            entity_id: "GLOBAL_SYSTEM_STATE",
            label: "Live Healthcare Network Grid",
            value_referenced: "400 Facilities Synchronized"
          }
        ],
        suggested_followups: [
          "Summarize Dengue outbreak surge status in Ernakulam",
          "Which facilities face imminent stockouts in the next 5 days?",
          "Show bed occupancy breakdown for District Hospital Ernakulam"
        ],
        action_links: [
          { label: "Emergency Command", path: "/emergency", icon_name: "Flame" },
          { label: "Pharmacy & FEFO", path: "/pharmacy", icon_name: "Pill" },
          { label: "Predictive Analytics", path: "/analytics", icon_name: "BarChart3" }
        ],
        answered_at: new Date().toISOString(),
        guardrails_passed: true
      }
    }
  ])

  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input.trim()
    if (!textToSend || loading) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const response: CopilotQueryResponse = await copilotService.queryCopilot({
        query: textToSend
      })

      const copilotMsg: ChatMessage = {
        id: `copilot-${Date.now()}`,
        sender: "copilot",
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        responsePayload: response
      }

      setMessages(prev => [...prev, copilotMsg])
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: "copilot",
        text: "I encountered an error processing your query against live telemetry. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (iconName: string) => {
    switch (iconName) {
      case "Flame": return <Flame className="w-3.5 h-3.5 text-red-400" />
      case "Truck": return <Truck className="w-3.5 h-3.5 text-blue-400" />
      case "Building2": return <Building2 className="w-3.5 h-3.5 text-emerald-400" />
      case "Pill": return <Pill className="w-3.5 h-3.5 text-amber-400" />
      case "BarChart3": return <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
      default: return <Activity className="w-3.5 h-3.5 text-teal-400" />
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 px-5 py-3 rounded-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-teal-500/20 to-blue-500/20 border border-teal-500/40 rounded-lg text-teal-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              Ask Theta AI Copilot
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Grounded Reasoning Engine
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Zero-hallucination decision support system
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Guardrails Active</span>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar */}
            <div className={`p-2 rounded-xl flex-shrink-0 ${
              msg.sender === "user"
                ? "bg-teal-600 text-white shadow-md shadow-teal-600/30"
                : "bg-slate-900 border border-teal-500/30 text-teal-400 shadow-md shadow-teal-500/10"
            }`}>
              {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Message Body */}
            <div className={`max-w-[85%] md:max-w-[75%] space-y-2 ${
              msg.sender === "user" ? "items-end" : "items-start"
            }`}>
              <div className={`p-4 rounded-2xl text-sm ${
                msg.sender === "user"
                  ? "bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-tr-none shadow-lg"
                  : "bg-slate-900/80 border border-slate-800 text-slate-200 rounded-tl-none backdrop-blur-md shadow-lg space-y-3"
              }`}>
                {/* Text Content */}
                <div className="prose prose-invert prose-sm whitespace-pre-wrap leading-relaxed max-w-none">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>

                {/* Grounding Citations */}
                {msg.responsePayload?.citations && msg.responsePayload.citations.length > 0 && (
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <Database className="w-3 h-3 text-teal-400" />
                      Verified System Grounding
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {msg.responsePayload.citations.map((cite, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-xs"
                        >
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold">
                            {cite.source_type.replace("_", " ")}
                          </span>
                          <span className="text-slate-300 font-medium">{cite.label}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400 text-[11px]">{cite.value_referenced}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Direct Action Deep Links */}
                {msg.responsePayload?.action_links && msg.responsePayload.action_links.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    {msg.responsePayload.action_links.map((link, i) => (
                      <Link
                        key={i}
                        to={link.path}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-all shadow-sm"
                      >
                        {getActionIcon(link.icon_name)}
                        <span>{link.label}</span>
                        <ArrowUpRight className="w-3 h-3 text-slate-400" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Timestamp & Suggested Followups */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                {msg.responsePayload?.confidence_score && (
                  <span className="text-[10px] text-teal-400 font-medium">
                    AI Confidence: {(msg.responsePayload.confidence_score * 100).toFixed(0)}%
                  </span>
                )}
              </div>

              {/* Followup Question Chips */}
              {msg.responsePayload?.suggested_followups && msg.responsePayload.suggested_followups.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {msg.responsePayload.suggested_followups.map((followup, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(followup)}
                      className="text-left text-[11px] px-2.5 py-1 bg-slate-900/50 hover:bg-slate-800 border border-slate-800/80 hover:border-teal-500/40 text-slate-400 hover:text-teal-300 rounded-full transition-all flex items-center gap-1"
                    >
                      <HelpCircle className="w-3 h-3 text-teal-400/70" />
                      {followup}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-slate-900 border border-teal-500/30 text-teal-400 flex-shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-none bg-slate-900/80 border border-slate-800 text-slate-400 text-sm flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
              <span>Analyzing live network telemetry & forecasting models...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 font-medium whitespace-nowrap">Suggested:</span>
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="whitespace-nowrap px-3 py-1 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/30 text-slate-300 hover:text-white rounded-lg transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
        className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 p-2 rounded-xl backdrop-blur-md"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Theta about stockouts, surge protocols, bed capacity, or transfers..."
          className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 disabled:opacity-40 text-white rounded-lg transition-all shadow-md shadow-teal-500/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
