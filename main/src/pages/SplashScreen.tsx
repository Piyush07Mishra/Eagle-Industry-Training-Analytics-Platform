import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Wifi } from "lucide-react";

const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      navigate("/login", { replace: true });
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute w-96 h-96 rounded-full bg-primary/10 blur-[120px] top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center gap-6"
      >
        <motion.div
          animate={{ boxShadow: ["0 0 20px hsl(145 80% 50% / 0.2)", "0 0 60px hsl(145 80% 50% / 0.5)", "0 0 20px hsl(145 80% 50% / 0.2)"] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-24 h-24 rounded-3xl bg-primary/20 flex items-center justify-center border border-primary/30"
        >
          <Lock className="w-12 h-12 text-primary" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
            Secure<span className="text-primary">Locker</span>
          </h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="flex items-center gap-2 mt-3 justify-center"
          >
            <Wifi className="w-4 h-4 text-primary/70" />
            <p className="text-muted-foreground text-sm">Smart Security for Smart Spaces</p>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-12 flex gap-1"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary/60"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default SplashScreen;
