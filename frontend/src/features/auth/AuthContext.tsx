import React, { createContext, useContext, useState, useEffect } from "react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged, User as FirebaseUser, signOut } from "firebase/auth"

export type RoleType =
  | "NATIONAL_ADMIN"
  | "STATE_DISTRICT_ADMIN"
  | "HOSPITAL_ADMIN"
  | "PHC_WORKER"
  | "DOCTOR_NURSE"
  | "PHARMACIST"
  | "SUPPLY_CHAIN_MANAGER"
  | "EMERGENCY_OFFICER"
  | "ANALYST"

export interface UserPersona {
  role: RoleType
  title: string
  name: string
  email: string
  scope: string
  facilityName?: string
  districtName?: string
  stateName?: string
  profile_picture?: string
}

const DEFAULT_GUEST: UserPersona = {
  role: "PHC_WORKER",
  title: "Guest",
  name: "Not Authenticated",
  email: "",
  scope: "None"
}

interface AuthContextType {
  currentUser: UserPersona
  firebaseUser: FirebaseUser | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserPersona>(DEFAULT_GUEST)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)
      if (user) {
        try {
          const idToken = await user.getIdToken();
          localStorage.setItem("theta_token", idToken);
          const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
          const res = await fetch(`${API_BASE}/profile/`, {
            headers: { Authorization: `Bearer ${idToken}` }
          });
          
          if (res.ok) {
            const data = await res.json();
            setCurrentUser({
              role: data.role || "PHC_WORKER",
              title: data.designation || "Healthcare Officer",
              name: data.name || user.displayName || "Authenticated User",
              email: data.email || user.email || "",
              scope: data.scope_level || "Facility",
              profile_picture: data.profile_picture || user.photoURL || undefined,
              facilityName: data.work_location,
              districtName: data.work_location,
            });
          } else {
            // Fallback
            setCurrentUser({
              role: "PHC_WORKER",
              title: "Healthcare Officer",
              name: user.displayName || "Authenticated User",
              email: user.email || "",
              scope: "Facility",
              profile_picture: user.photoURL || undefined,
            });
          }
        } catch (e) {
          // Fallback
          setCurrentUser({
            role: "PHC_WORKER",
            title: "Healthcare Officer",
            name: user.displayName || "Authenticated User",
            email: user.email || "",
            scope: "Facility",
            profile_picture: user.photoURL || undefined,
          });
        }
      } else {
        setCurrentUser(DEFAULT_GUEST)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const logout = async () => {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        loading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
