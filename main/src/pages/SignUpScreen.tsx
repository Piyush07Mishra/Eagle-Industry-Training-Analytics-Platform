import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Mail, User, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const SignUpScreen: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, isLoading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState<"trainee" | "trainer" | "admin" | "client">("trainee");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!fullName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      await signUp(fullName, email, password);
      // Navigation happens automatically via AuthContext + login page redirect
    } catch (err: any) {
      setError(err.message || "Sign up failed");
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute w-80 h-80 rounded-full bg-primary/5 blur-[100px] bottom-20 left-0" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm z-10"
      >
        <div className="flex flex-col items-center mb-6">
          <motion.div
            animate={{ boxShadow: ["0 0 15px hsl(145 80% 50% / 0.2)", "0 0 40px hsl(145 80% 50% / 0.4)", "0 0 15px hsl(145 80% 50% / 0.2)"] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 mb-4"
          >
            <User className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-display font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground text-sm mt-1">Join SecureLocker today</p>
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

        <div className="glass-card p-6 sm:p-8 rounded-2xl border border-primary/10 bg-card/60 backdrop-blur-md shadow-xl">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full glass-input pl-11 pr-4 py-3.5 text-sm" />
          </div>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full glass-input pl-11 pr-4 py-3.5 text-sm" />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full glass-input pl-11 pr-12 py-3.5 text-sm" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type={showPassword ? "text" : "password"} placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full glass-input pl-11 pr-4 py-3.5 text-sm" />
          </div>

            {error && (
              <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-destructive text-xs">{error}</motion.p>
            )}

            <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={isLoading} className="w-full btn-primary py-3.5 mt-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md text-sm disabled:opacity-50">
              {isLoading ? "Creating Account..." : `Sign Up as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8 bg-background/50 py-2 rounded-full backdrop-blur-sm px-6 mx-auto w-max border border-border/50 shadow-sm text-foreground/80">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-semibold hover:text-primary/80 transition-colors">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default SignUpScreen;
