import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role } from "./mock-data";

interface AuthState {
  role: Role | null;
  setRole: (r: Role | null) => void;
}

const AuthCtx = createContext<AuthState>({ role: null, setRole: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const r = window.localStorage.getItem("edutrack:role") as Role | null;
    if (r) setRoleState(r);
  }, []);

  const setRole = (r: Role | null) => {
    setRoleState(r);
    if (typeof window !== "undefined") {
      if (r) window.localStorage.setItem("edutrack:role", r);
      else window.localStorage.removeItem("edutrack:role");
    }
  };

  return <AuthCtx.Provider value={{ role, setRole }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
