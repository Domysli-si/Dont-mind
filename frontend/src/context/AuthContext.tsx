import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

const DEMO_USER_ID = "demo-00000000-0000-0000-0000-000000000000";

const DEMO_USER = {
  id: DEMO_USER_ID,
  email: "demo@dont-worry.app",
  aud: "authenticated",
  role: "authenticated",
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
} as unknown as User;

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isDemo: boolean;
  signIn: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  demoLogin: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("demo_mode") === "true") {
      setUser(DEMO_USER);
      setIsDemo(true);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    if (isDemo) {
      localStorage.removeItem("demo_mode");
      setIsDemo(false);
      setUser(null);
      setSession(null);
      return;
    }
    await supabase.auth.signOut();
  };

  const demoLogin = () => {
    localStorage.setItem("demo_mode", "true");
    setIsDemo(true);
    setUser(DEMO_USER);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, isDemo, signIn, signOut, demoLogin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
