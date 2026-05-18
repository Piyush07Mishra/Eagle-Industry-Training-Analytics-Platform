import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheck } from "lucide-react";

const ROLE_REDIRECTS: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  TRAINER: "/trainer/dashboard",
  TRAINEE: "/trainee/dashboard",
  CLIENT: "/client/dashboard",
};

const TrainingLoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!employeeId || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      await login(employeeId, password);
      // Read role from stored user (login sets it)
      const stored = localStorage.getItem("user");
      const u = stored ? JSON.parse(stored) : null;
      const dest = ROLE_REDIRECTS[u?.role] || "/login";
      navigate(dest, { replace: true });
    } catch {
      setError("Invalid Employee ID or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Eagle Training Portal</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in with your employee credentials</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Employee ID
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                placeholder="e.g. trainer01 or trainee05"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password@123"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg text-sm transition-colors shadow-sm"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center font-medium mb-3">Demo Accounts</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[["admin01","Admin"],["trainer01","Trainer"],["trainee01","Trainee"],["client01","Client"]].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => { setEmployeeId(id); setPassword("Password@123"); }}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-600 transition text-left"
                >
                  <span className="font-medium text-slate-800">{label}</span><br/>
                  <span className="text-slate-400">{id}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingLoginPage;
