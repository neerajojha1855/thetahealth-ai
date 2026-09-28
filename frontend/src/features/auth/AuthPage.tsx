import React, { useState } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { 
  Shield, 
  Activity, 
  Lock, 
  Mail, 
  User, 
  Building, 
  MapPin, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  Sparkles, 
  Radio, 
  ArrowRight,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/AuthContext"
import { auth } from "@/lib/firebase"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"

export function AuthPage({ initialTab = "login" }: { initialTab?: "login" | "register" }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { switchRole } = useAuth()
  
  const [tab, setTab] = useState<"login" | "register">(
    (searchParams.get("tab") as "login" | "register") || initialTab
  )
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  
  // Register form state
  const [regName, setRegName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regConfirmPassword, setRegConfirmPassword] = useState("")
  const [regDesignation, setRegDesignation] = useState("Medical Officer")
  const [regFacility, setRegFacility] = useState("")
  const [showRegPassword, setShowRegPassword] = useState(false)
  
  // Status state
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Real-time password criteria
  const hasMinLength = regPassword.length >= 8
  const hasUppercase = /[A-Z]/.test(regPassword)
  const hasNumber = /[0-9]/.test(regPassword)
  const hasSpecial = /[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]/.test(regPassword)
  const passwordsMatch = regPassword.length > 0 && regPassword === regConfirmPassword
  const isRegisterValid = hasMinLength && hasUppercase && hasNumber && hasSpecial && passwordsMatch && regEmail && regName

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setIsLoading(true)

    try {
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      const idToken = await userCredential.user.getIdToken();

      // Optional: you can still call the backend if you need to fetch/create custom roles, 
      // but for now, the Firebase client is logged in and AuthContext will pick it up.
      // We will sync with the backend just like Google SSO to be safe, or just store the token.
      localStorage.setItem("theta_token", idToken)
      
      // Fetch backend user data to update role if needed
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${idToken}` }
      })
      if (response.ok) {
        const data = await response.json()
        if (data.role && switchRole) {
          switchRole(data.role)
        }
      }

      navigate("/command-center")
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in. Please verify your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    if (!passwordsMatch) {
      setErrorMsg("Passwords do not match")
      return
    }
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          confirm_password: regConfirmPassword,
          name: regName,
          designation: regDesignation,
          work_location: regFacility,
          organization: "National Health Mission",
          role: "DOCTOR_NURSE"
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || "Registration failed")
      }

      setSuccessMsg("Account successfully registered! Signing in...")
      
      // Sign in the client with Firebase Auth
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      const userCredential = await signInWithEmailAndPassword(auth, regEmail, regPassword);
      const idToken = await userCredential.user.getIdToken();
      localStorage.setItem("theta_token", idToken);

      // Fetch user profile to get the role
      const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${idToken}` }
      })
      if (meRes.ok) {
        const meData = await meRes.json()
        if (meData.role && switchRole) {
          switchRole(meData.role)
        }
      }

      setTimeout(() => {
        navigate("/command-center")
      }, 1000)
    } catch (err: any) {
      setErrorMsg(err.message || "Registration failed. Please check your inputs.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSSO = async () => {
    setErrorMsg(null)
    setIsLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const idToken = await result.user.getIdToken()

      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: idToken })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || "Google authentication failed")
      }

      localStorage.setItem("theta_token", data.access_token)
      navigate("/command-center")
    } catch (err: any) {
      setErrorMsg(err.message || "Google Sign-In was cancelled or failed.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070C15] text-slate-100 flex flex-col lg:flex-row">
      {/* Left 50%: Mission Control Telemetry Showcase */}
      <div className="lg:w-1/2 relative p-8 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#1E293B] bg-gradient-to-br from-[#0B111E] via-[#070C15] to-[#0A1628] overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Brand header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="h-full w-full bg-[#070C15] rounded-[10px] flex items-center justify-center">
                <Activity className="h-5 w-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-wider text-white">THETAHEALTH AI</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                  BRICS — RESILIENCE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono tracking-tight">PREDICT · PREVENT · COORDINATE · RESILIENCE</p>
            </div>
          </div>
        </div>

        {/* Hero Mission Control Intelligence */}
        <div className="relative z-10 my-12 space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              National Healthcare Resource & Pharmaceutical Supply-Chain Control
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
              Connecting Primary Health Centres, District Hospitals, and Pharmaceutical Corridors with real-time Vertex AI demand prediction and autonomous supply rebalancing.
            </p>
          </div>

          {/* Telemetry preview cards */}
          <div className="grid grid-cols-2 gap-3 max-w-lg">
            <div className="p-3.5 rounded-xl border border-[#1E293B] bg-[#131E31]/70 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-400">RESILIENCE INDEX</span>
                <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
              </div>
              <div className="text-2xl font-bold font-mono text-cyan-400">78 / 100</div>
              <div className="text-[10px] text-emerald-400 mt-1">↑ +3.4 pts (Stable / Watch)</div>
            </div>

            <div className="p-3.5 rounded-xl border border-[#1E293B] bg-[#131E31]/70 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-400">ACTIVE FACILITIES</span>
                <Shield className="h-3 w-3 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">428 Nodes</div>
              <div className="text-[10px] text-cyan-400 mt-1">94.6% Medicine Buffer</div>
            </div>
          </div>
        </div>

        {/* Standards & compliance footer */}
        <div className="relative z-10 flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-mono border-t border-[#1E293B]/70 pt-4">
          <span>● HIPAA & NDHM SECURED</span>
          <span>● DEFCON-2 READINESS</span>
          <span>● ASIA-SOUTH-1 NODE</span>
        </div>
      </div>

      {/* Right 50%: Interactive Authentication Form */}
      <div className="lg:w-1/2 p-6 sm:p-10 lg:p-16 flex items-center justify-center bg-[#070C15]">
        <div className="w-full max-w-md space-y-6">
          {/* Tab Switcher */}
          <div className="flex rounded-xl bg-[#0E1726] border border-[#1E293B] p-1">
            <button
              onClick={() => { setTab("login"); setErrorMsg(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === "login" 
                  ? "bg-cyan-500 text-slate-950 shadow-md font-bold" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab("register"); setErrorMsg(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === "register" 
                  ? "bg-cyan-500 text-slate-950 shadow-md font-bold" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 rounded-lg border border-red-500/40 bg-red-950/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-lg border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Continue with Google SSO */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSSO}
            disabled={isLoading}
            className="w-full h-11 border-[#1E293B] bg-[#131E31] hover:bg-[#1A2942] hover:border-cyan-500/40 text-slate-200 text-xs font-semibold gap-3 transition-all"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Continue with Google SSO
          </Button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#1E293B]"></div>
            <span className="flex-shrink mx-4 text-[10px] text-slate-500 font-mono tracking-wider uppercase">
              OR CONTINUE WITH EMAIL
            </span>
            <div className="flex-grow border-t border-[#1E293B]"></div>
          </div>

          {/* TAB A: SIGN IN */}
          {tab === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Official Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="officer@health.gov.in"
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#1E293B] bg-[#0E1726] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-slate-300">Password</label>
                  <button type="button" className="text-[11px] text-cyan-400 hover:underline">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-10 pl-9 pr-10 rounded-lg border border-[#1E293B] bg-[#0E1726] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#1E293B] bg-[#0E1726] text-cyan-500 focus:ring-0"
                />
                <label htmlFor="remember" className="text-xs text-slate-400 select-none">
                  Remember me
                </label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs gap-2 transition-all shadow-lg shadow-cyan-500/20"
              >
                {isLoading ? "Authenticating..." : "Sign In to Command Center"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}

          {/* TAB B: REGISTER */}
          {tab === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Dr. Rajesh Varma"
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#1E293B] bg-[#0E1726] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Official Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="rajesh.varma@health.gov.in"
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#1E293B] bg-[#0E1726] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Designation</label>
                  <select
                    value={regDesignation}
                    onChange={(e) => setRegDesignation(e.target.value)}
                    className="w-full h-9 px-2 rounded-lg border border-[#1E293B] bg-[#0E1726] text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Medical Officer">Medical Officer</option>
                    <option value="Chief Pharmacist">Chief Pharmacist</option>
                    <option value="District Health Officer">District Health Officer</option>
                    <option value="Supply Chain Lead">Supply Chain Lead</option>
                    <option value="PHC Nurse/Worker">PHC Nurse/Worker</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Work Location</label>
                  <input
                    type="text"
                    value={regFacility}
                    onChange={(e) => setRegFacility(e.target.value)}
                    placeholder="e.g. Solapur DH"
                    className="w-full h-9 px-3 rounded-lg border border-[#1E293B] bg-[#0E1726] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create complex password"
                    className="w-full h-9 pl-9 pr-10 rounded-lg border border-[#1E293B] bg-[#0E1726] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-2 text-slate-500 hover:text-slate-300"
                  >
                    {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#1E293B] bg-[#0E1726] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Real-time Password Criteria Checklist */}
              <div className="p-3 rounded-lg border border-[#1E293B] bg-[#0E1726]/80 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">Password Requirements:</span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-400" : "text-slate-500"}`}>
                    {hasMinLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUppercase ? "text-emerald-400" : "text-slate-500"}`}>
                    {hasUppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    <span>1 uppercase letter (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-400" : "text-slate-500"}`}>
                    {hasNumber ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    <span>1 numeric digit (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasSpecial ? "text-emerald-400" : "text-slate-500"}`}>
                    {hasSpecial ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    <span>1 special symbol (@$!%*?)</span>
                  </div>
                </div>
                {regConfirmPassword && (
                  <div className={`text-[11px] flex items-center gap-1.5 pt-1 border-t border-[#1E293B] ${passwordsMatch ? "text-emerald-400" : "text-red-400"}`}>
                    {passwordsMatch ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    <span>{passwordsMatch ? "Passwords match" : "Passwords do not match"}</span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || !isRegisterValid}
                className="w-full h-11 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs gap-2 transition-all shadow-lg shadow-cyan-500/20"
              >
                {isLoading ? "Creating Account..." : "Register Credentials"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}

          <div className="text-center pt-2">
            <Link to="/command-center" className="text-xs text-slate-500 hover:text-cyan-400 transition-colors">
              Continue as Guest / Switch Demo Persona →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
