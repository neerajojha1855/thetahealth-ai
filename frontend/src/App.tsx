import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import { AuthProvider, useAuth } from "@/features/auth/AuthContext"
import { AppLayout } from "@/components/layout/AppLayout"
import { AuthPage } from "@/features/auth/AuthPage"
import { UserProfilePage } from "@/features/profile/UserProfilePage"
import { CommandCenterPage } from "@/features/command-center/CommandCenterPage"
import { FacilityNetworkPage } from "@/features/facilities/FacilityNetworkPage"
import { ThetaVoicePage } from "@/features/voice/ThetaVoicePage"
import { PharmacyPage } from "@/features/pharmacy/PharmacyPage"
import { SupplyChainPage } from "@/features/supply-chain/SupplyChainPage"
import { EmergencyPage } from "@/features/emergency/EmergencyPage"
import { SimulatorPage } from "@/features/simulator/SimulatorPage"
import { CopilotPage } from "@/features/copilot/CopilotPage"
import { AnalyticsPage } from "@/features/analytics/AnalyticsPage"
import { SettingsPage } from "@/features/settings/SettingsPage"

function ProtectedRoute() {
  const { firebaseUser, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070C15] flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse">Initializing Security Protocols...</div>
      </div>
    )
  }
  
  if (!firebaseUser) {
    return <Navigate to="/login" replace />
  }
  
  return <Outlet />
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Standalone Authentication Portal */}
          <Route path="/login" element={<AuthPage initialTab="login" />} />
          <Route path="/register" element={<AuthPage initialTab="register" />} />

          {/* Main App Layout - Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<CommandCenterPage />} />
              <Route path="command-center" element={<CommandCenterPage />} />
              <Route path="facilities" element={<FacilityNetworkPage />} />
              <Route path="voice" element={<ThetaVoicePage />} />
              <Route path="pharmacy" element={<PharmacyPage />} />
              <Route path="supply-chain" element={<SupplyChainPage />} />
              <Route path="emergency" element={<EmergencyPage />} />
              <Route path="simulator" element={<SimulatorPage />} />
              <Route path="copilot" element={<CopilotPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<UserProfilePage />} />
              {/* Catch-all to Command Center */}
              <Route path="*" element={<CommandCenterPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
