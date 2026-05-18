import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Mail, Eye, EyeOff, Fingerprint } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState<"trainee" | "trainer" | "admin" | "client">("trainee");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute w-80 h-80 rounded-full bg-primary/5 blur-[100px] top-20 right-0" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <motion.div
            animate={{ boxShadow: ["0 0 15px hsl(145 80% 50% / 0.2)", "0 0 40px hsl(145 80% 50% / 0.4)", "0 0 15px hsl(145 80% 50% / 0.2)"] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 mb-4"
          >
            <Lock className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-display font-bold text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to SecureLocker</p>
        </div>

        {/* Role Toggle */}
        <div className="flex bg-secondary/50 rounded-lg p-1 mb-6 border border-border/50 shadow-sm backdrop-blur-sm">
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === "trainee" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setRole("trainee")}
          >
            Trainee
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === "trainer" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setRole("trainer")}
          >
            Trainer
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === "admin" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setRole("admin")}
          >
            Admin
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === "client" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setRole("client")}
          >
            Client
          </button>
        </div>

        {/* Form Container to match dashboard style */}
        <div className="glass-card p-6 sm:p-8 rounded-2xl border border-primary/10 bg-card/60 backdrop-blur-md shadow-xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full glass-input pl-11 pr-4 py-3.5 text-sm"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full glass-input pl-11 pr-12 py-3.5 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-destructive text-xs"
            >
              {error}
            </motion.p>
          )}

          <div className="text-right">
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot Password?
            </Link>
          </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3.5 text-sm disabled:opacity-50 mt-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md"
            >
              {isLoading ? "Signing in..." : `Sign In as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
            </motion.button>
          </form>

          {/* Biometric */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="w-full mt-6 py-3 rounded-lg border border-border bg-secondary/50 flex flex-row items-center justify-center gap-2 text-sm text-foreground hover:bg-secondary transition-colors"
            onClick={() => {
              // Simulated biometric
              login(`demo@${role}.securelocker.io`, "demo");
              navigate("/dashboard", { replace: true });
            }}
          >
            <Fingerprint className="w-5 h-5 text-primary" />
            Use Biometric Login
          </motion.button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8 bg-background/50 py-2 rounded-full backdrop-blur-sm px-6 mx-auto w-max border border-border/50 shadow-sm text-foreground/80">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary font-semibold hover:text-primary/80 transition-colors">
            Sign Up
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
