import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../../lib/api";
import type { User } from "../../lib/types";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string;
  setUser: (user: User | null) => void;
  restore: () => Promise<void>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const cache = useQueryClient();
  const restore = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUser(await api.me());
    } catch (err) {
      setUser(null);
      if (!(err instanceof ApiError && err.status === 401))
        setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void restore();
  }, [restore]);
  useEffect(() => {
    const expire = () => {
      setUser(null);
      cache.clear();
    };
    window.addEventListener("session-expired", expire);
    return () => window.removeEventListener("session-expired", expire);
  }, [cache]);
  async function logout() {
    await api.logout();
    setUser(null);
    cache.clear();
  }
  return (
    <AuthContext.Provider
      value={{ user, loading, error, setUser, restore, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider is required");
  return value;
}
