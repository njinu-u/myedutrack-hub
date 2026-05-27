import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "./mock-data";

export type AppRole = Role | "school_admin" | "super_admin";

export interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  school_id: string | null;
  linked_student_id: string | null;
  avatar_url: string | null;
  phone_number: string | null;
}

interface AuthState {
  // Demo mode: localStorage-only role pick (used by /demo links)
  role: Role | null;
  setRole: (r: Role | null) => void;

  // Real auth
  user: User | null;
  session: Session | null;
  appUser: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;

  // Helpers
  isDemo: boolean;        // true when there's a demo role but no real user
  isAuthed: boolean;      // true when there's a real Supabase session
  effectiveRole: Role | null; // demo role OR mapped role from appUser
}

const AuthCtx = createContext<AuthState>({
  role: null, setRole: () => {},
  user: null, session: null, appUser: null, loading: true,
  signOut: async () => {},
  isDemo: false, isAuthed: false, effectiveRole: null,
});

function mapAppRoleToPortalRole(r: AppRole): Role | null {
  switch (r) {
    case "school_admin": return "admin";
    case "teacher": return "teacher";
    case "counselor": return "counselor";
    case "parent": return "parent";
    case "student": return "student";
    default: return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Demo role from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const r = window.localStorage.getItem("edutrack:role") as Role | null;
    if (r) setRoleState(r);
  }, []);

  // Supabase session listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (!sess?.user) {
        setAppUser(null);
        setLoading(false);
        return;
      }
      // Defer profile fetch to avoid deadlocks
      setTimeout(() => { void fetchAppUser(sess.user.id); }, 0);
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        void fetchAppUser(sess.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchAppUser(uid: string) {
    const { data } = await supabase
      .from("app_users")
      .select("id,email,full_name,role,school_id,linked_student_id")
      .eq("id", uid)
      .maybeSingle();
    setAppUser(data as AppUser | null);
    setLoading(false);
  }

  const setRole = (r: Role | null) => {
    setRoleState(r);
    if (typeof window !== "undefined") {
      if (r) window.localStorage.setItem("edutrack:role", r);
      else window.localStorage.removeItem("edutrack:role");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
  };

  const isAuthed = !!user;
  const isDemo = !isAuthed && !!role;
  const effectiveRole: Role | null = isAuthed && appUser ? mapAppRoleToPortalRole(appUser.role) : role;

  return (
    <AuthCtx.Provider value={{
      role, setRole, user, session, appUser, loading, signOut,
      isDemo, isAuthed, effectiveRole,
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
