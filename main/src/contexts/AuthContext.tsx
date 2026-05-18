import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

export type UserRole = "ADMIN" | "TRAINER" | "TRAINEE" | "CLIENT";

export interface User {
  id: string;
  username: string;
  employee_id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  site_location: string;
  managed_site: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const API = "http://localhost:8000";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch { localStorage.clear(); }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      // 1. Get JWT tokens
      const tokenRes = await fetch(`${API}/api/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!tokenRes.ok) throw new Error("Invalid credentials");
      const tokenData = await tokenRes.json();

      localStorage.setItem("accessToken", tokenData.access);
      localStorage.setItem("refreshToken", tokenData.refresh);

      // 2. Fetch full profile from /api/me/
      const meRes = await fetch(`${API}/api/me/`, {
        headers: { Authorization: `Bearer ${tokenData.access}` },
      });
      if (!meRes.ok) throw new Error("Failed to load profile");
      const me = await meRes.json();

      const userObj: User = {
        id: String(me.id),
        username: me.username,
        employee_id: me.employee_id || me.username,
        name: me.name || `${me.first_name} ${me.last_name}`.trim() || me.username,
        email: me.email || "",
        role: (tokenData.role || me.role) as UserRole,
        department: me.department || "",
        site_location: me.site_location || "",
        managed_site: me.managed_site || "",
      };

      setUser(userObj);
      localStorage.setItem("user", JSON.stringify(userObj));
      toast.success("Login successful!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
