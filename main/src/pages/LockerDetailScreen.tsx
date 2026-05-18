import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, LockOpen, AlertTriangle, Battery, Wifi, Volume2, VolumeX, Clock } from "lucide-react";
import { mockLockers } from "@/data/mockLockers";
import { toast } from "sonner";

const LockerDetailScreen: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const locker = mockLockers.find((l) => l.id === id);
  const [buzzerOn, setBuzzerOn] = useState(false);
  const [status, setStatus] = useState(locker?.status || "locked");

  if (!locker) return <div className="min-h-screen gradient-bg flex items-center justify-center text-foreground">Locker not found</div>;

  const toggleLock = () => {
    const next = status === "locked" ? "open" : "locked";
    setStatus(next);
    toast.success(next === "locked" ? "Locker locked" : "Locker unlocked");
  };

  const toggleBuzzer = () => {
    setBuzzerOn(!buzzerOn);
    toast.info(buzzerOn ? "Buzzer deactivated" : "Buzzer activated!");
  };

  const iconMap = {
    locked: <Lock className="w-16 h-16 text-primary" />,
    open: <LockOpen className="w-16 h-16 text-warning" />,
    forced: <AlertTriangle className="w-16 h-16 text-destructive" />,
  };

  const glowMap = {
    locked: "neon-glow-green animate-pulse-green",
    open: "neon-glow-yellow",
    forced: "neon-glow-red animate-pulse-red",
  };

  return (
    <div className="min-h-screen gradient-bg pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-display font-bold text-foreground">{locker.name}</h1>
          <p className="text-xs text-muted-foreground">{locker.number}</p>
        </div>
      </div>

      {/* Lock Icon */}
      <div className="flex justify-center py-10">
        <motion.div
          key={status}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className={`w-32 h-32 rounded-3xl flex items-center justify-center ${
            status === "locked" ? "bg-primary/10 border-primary/30" : status === "open" ? "bg-warning/10 border-warning/30" : "bg-destructive/10 border-destructive/30"
          } border ${glowMap[status]}`}
        >
          {iconMap[status]}
        </motion.div>
      </div>

      <p className={`text-center font-display font-bold text-lg mb-8 ${
        status === "locked" ? "text-primary" : status === "open" ? "text-warning" : "text-destructive"
      }`}>
        {status === "locked" ? "Secured" : status === "open" ? "Unlocked" : "⚠ Forced Entry"}
      </p>

      {/* Stats */}
      <div className="px-5 grid grid-cols-3 gap-3 mb-8">
        {[
          { icon: <Battery className="w-4 h-4" />, label: "Battery", value: `${locker.battery}%` },
          { icon: <Wifi className="w-4 h-4" />, label: "Signal", value: `${locker.signal}%` },
          { icon: <Clock className="w-4 h-4" />, label: "Updated", value: locker.lastUpdated },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-3 text-center">
            <div className="flex justify-center text-muted-foreground mb-1">{stat.icon}</div>
            <p className="text-foreground text-sm font-medium">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="px-5 space-y-3">
        <motion.button whileTap={{ scale: 0.97 }} onClick={toggleLock} className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
          status === "locked" ? "bg-warning/20 text-warning border border-warning/30" : "btn-primary"
        }`}>
          {status === "locked" ? "Unlock Locker" : "Lock Locker"}
        </motion.button>

        <motion.button whileTap={{ scale: 0.97 }} onClick={toggleBuzzer} className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
          buzzerOn ? "btn-destructive" : "glass-card text-foreground hover:border-primary/30"
        }`}>
          {buzzerOn ? <><VolumeX className="w-4 h-4" /> Stop Buzzer</> : <><Volume2 className="w-4 h-4" /> Activate Buzzer</>}
        </motion.button>
      </div>
    </div>
  );
};

export default LockerDetailScreen;
