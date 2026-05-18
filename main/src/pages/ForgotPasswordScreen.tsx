import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const ForgotPasswordScreen: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    await resetPassword(email);
    setSent(true);
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Link to="/login" className="flex items-center gap-2 text-muted-foreground text-sm mb-8 hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>

        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Reset Password</h1>
        <p className="text-muted-foreground text-sm mb-8">Enter your email to receive a reset link.</p>

        {sent ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <p className="text-foreground font-medium">Check your email</p>
            <p className="text-muted-foreground text-sm mt-2">We've sent a reset link to {email}</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full glass-input pl-11 pr-4 py-3.5 text-sm" />
            </div>
            <motion.button whileTap={{ scale: 0.97 }} type="submit" className="w-full btn-primary py-3.5 text-sm">
              Send Reset Link
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPasswordScreen;
