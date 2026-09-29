import React, { useState, useEffect, useRef } from "react"
import { 
  User, 
  Mail, 
  Building, 
  MapPin, 
  Shield, 
  Save, 
  Check, 
  AlertCircle, 
  Camera, 
  Radio, 
  Activity 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/features/auth/AuthContext"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"

export function UserProfilePage() {
  const { currentUser, firebaseUser } = useAuth()

  const [name, setName] = useState(currentUser.name || "")
  const [email, setEmail] = useState(currentUser.email || "")
  const [profilePic, setProfilePic] = useState(currentUser.profile_picture || "")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [designation, setDesignation] = useState(currentUser.title || "")
  const [organization, setOrganization] = useState(currentUser.organisation || "")
  const [workLocation, setWorkLocation] = useState(currentUser.facilityName || currentUser.districtName || "")
  const [role, setRole] = useState(currentUser.role || "")

  // Sync state if currentUser resolves after initial render
  useEffect(() => {
    if (currentUser.profile_picture && !profilePic) setProfilePic(currentUser.profile_picture)
    if (currentUser.name && !name) setName(currentUser.name)
    if (currentUser.email && !email) setEmail(currentUser.email)
    if (currentUser.organisation && !organization) setOrganization(currentUser.organisation)
  }, [currentUser])

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setStatusMsg(null)
    
    const uid = firebaseUser?.uid || currentUser.email ? btoa(currentUser.email || "unknown") : "unknown_user"
    const fileRef = ref(storage, `users/${uid}/profile_pic_${Date.now()}`)
    
    try {
      await uploadBytes(fileRef, file)
      const url = await getDownloadURL(fileRef)
      setProfilePic(url)
      setStatusMsg({ type: "success", text: "Image uploaded! Click 'Save Profile Details' to confirm." })
    } catch (err: any) {
      setStatusMsg({ type: "error", text: "Failed to upload image: " + err.message })
    } finally {
      setIsUploading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const token = localStorage.getItem("theta_token")
    if (!token) return
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/profile/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        if (data.name) setName(data.name)
        if (data.email) setEmail(data.email)
        if (data.profile_picture) setProfilePic(data.profile_picture)
        if (data.designation) setDesignation(data.designation)
        if (data.organisation) setOrganization(data.organisation)
        if (data.work_location) setWorkLocation(data.work_location)
        if (data.role) setRole(data.role)
      }
    } catch (e) {
      console.error("Failed to load profile:", e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setStatusMsg(null)

    const token = localStorage.getItem("theta_token")
    try {
      const res = await fetch(`${API_BASE_URL}/profile/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name,
          profile_picture: profilePic,
          designation,
          organisation: organization,
          work_location: workLocation
        })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || "Failed to save changes to profile")
      }

      setStatusMsg({ type: "success", text: "Profile details updated successfully!" })
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to save profile." })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1E293B] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white">Healthcare Personnel Profile</h1>
            <Badge variant="ai" className="text-xs">DEFCON-2 Verified</Badge>
          </div>
          <p className="text-xs text-slate-400">
            View and modify official credentials, jurisdictional assignment, and organization details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-400">Sync: Live</span>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 ${
          statusMsg.type === "success" 
            ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-300" 
            : "border-red-500/40 bg-red-950/20 text-red-300"
        }`}>
          {statusMsg.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card & Avatar */}
        <div className="p-6 rounded-2xl border border-[#1E293B] bg-[#131E31] flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group cursor-pointer" title="Upload profile picture" onClick={() => fileInputRef.current?.click()}>
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-tr from-cyan-600 to-slate-800 border-2 border-cyan-500/50 flex items-center justify-center text-cyan-300 text-3xl font-bold shadow-xl overflow-hidden group-hover:opacity-80 transition-opacity">
              {profilePic ? (
                <img src={profilePic} alt={name} className="h-full w-full object-cover" />
              ) : (
                <span>{name ? name.slice(0, 2).toUpperCase() : "DR"}</span>
              )}
            </div>
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity bg-slate-950/40 rounded-2xl ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              {isUploading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </div>
          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-white">{name || "Healthcare Officer"}</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                {role || "Doctor"}
              </span>
            </div>
            <p className="text-xs text-slate-400">{designation} · {organization}</p>
            <p className="text-xs font-mono text-slate-500">{email}</p>
          </div>
        </div>

        {/* Input Details Grid */}
        <div className="p-6 rounded-2xl border border-[#1E293B] bg-[#131E31] space-y-4">
          <h3 className="text-sm font-semibold text-white border-b border-[#1E293B] pb-3">Official Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#1E293B] bg-[#0E1726] text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address (Read-only)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#1E293B] bg-[#0E1726]/50 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Designation</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Medical Superintendent"
                className="w-full h-10 px-3 rounded-lg border border-[#1E293B] bg-[#0E1726] text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Organization</label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#1E293B] bg-[#0E1726] text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Work Location / Primary Facility</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                  placeholder="e.g. Solapur District Hospital"
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#1E293B] bg-[#0E1726] text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Action button */}
        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            disabled={isSaving}
            className="h-10 px-6 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs gap-2 transition-all shadow-md shadow-cyan-500/20"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving Changes..." : "Save Profile Details"}
          </Button>
        </div>
      </form>
    </div>
  )
}
