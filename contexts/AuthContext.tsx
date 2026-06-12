"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabaseAuth } from "@/lib/supabase-client";
import { LOCAL_STORAGE_TOKEN_KEY } from "@/lib/constants";
import type { AuthUser, UserRole } from "@/lib/types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ role: UserRole }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserFromToken = useCallback(async (token: string) => {
    const {
      data: { user: supaUser },
      error,
    } = await supabaseAuth.auth.getUser(token);

    if (error || !supaUser) {
      localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
      setUser(null);
      return null;
    }

    // Fetch profile from DATA via our API
    const res = await fetch("/api/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
      setUser(null);
      return null;
    }

    const profile = await res.json();
    const adminUserId: string = profile.admin_user_id ?? supaUser.id;

    const authUser: AuthUser = {
      id: supaUser.id,
      email: supaUser.email ?? "",
      profile,
      adminUserId,
    };

    setUser(authUser);
    return authUser;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    if (token) {
      loadUserFromToken(token).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [loadUserFromToken]);

  const login = useCallback(
    async (email: string, password: string): Promise<{ role: UserRole }> => {
      const { data, error } = await supabaseAuth.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        throw new Error(error?.message ?? "Login failed");
      }

      const token = data.session.access_token;
      localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, token);

      const authUser = await loadUserFromToken(token);
      if (!authUser) throw new Error("Could not load user profile");

      return { role: authUser.profile.rol };
    },
    [loadUserFromToken]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
    setUser(null);
    supabaseAuth.auth.signOut().catch(() => {});
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    if (token) await loadUserFromToken(token);
  }, [loadUserFromToken]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
