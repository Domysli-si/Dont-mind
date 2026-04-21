import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const DEMO_USER_ID = "demo-00000000-0000-0000-0000-000000000000";

interface AppUser {
  id: string;
  email: string;
  aud?: string;
  role?: string;
  created_at?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}

const DEMO_USER: AppUser = {
  id: DEMO_USER_ID,
  email: "demo@dont-worry.app",
  aud: "authenticated",
  role: "authenticated",
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
};

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  isDemo: boolean;
  token: string | null;
  register: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  demoLogin: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("demo_mode") === "true") {
      setUser(DEMO_USER);
      setIsDemo(true);
      setLoading(false);
      return;
    }

    const savedToken = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("auth_user");
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
    }
    setLoading(false);
  }, []);

  const register = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { error: body.detail || `Registration failed (${res.status})` };
      }

      const data = await res.json();
      const appUser: AppUser = {
        id: data.user_id,
        email: data.email,
        role: "user",
      };

      localStorage.setItem("auth_token", data.access_token);
      localStorage.setItem("auth_user", JSON.stringify(appUser));
      setToken(data.access_token);
      setUser(appUser);
      return { error: null };
    } catch (err: any) {
      return { error: err.message || "Network error" };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { error: body.detail || `Login failed (${res.status})` };
      }

      const data = await res.json();
      const appUser: AppUser = {
        id: data.user_id,
        email: data.email,
        role: "user",
      };

      localStorage.setItem("auth_token", data.access_token);
      localStorage.setItem("auth_user", JSON.stringify(appUser));
      setToken(data.access_token);
      setUser(appUser);
      return { error: null };
    } catch (err: any) {
      return { error: err.message || "Network error" };
    }
  };

  const signOut = async () => {
    if (isDemo) {
      localStorage.removeItem("demo_mode");
      setIsDemo(false);
      setUser(null);
      setToken(null);
      return;
    }
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setToken(null);
    setUser(null);
  };

  const demoLogin = () => {
    localStorage.setItem("demo_mode", "true");
    setIsDemo(true);
    setUser(DEMO_USER);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isDemo, token, register, signIn, signOut, demoLogin }}
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
