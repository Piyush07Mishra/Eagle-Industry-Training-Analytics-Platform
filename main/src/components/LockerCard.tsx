import React from "react";
import { motion } from "framer-motion";
import { Lock, LockOpen, AlertTriangle, Battery, Wifi, ChevronRight } from "lucide-react";
import { Locker, LockerStatus } from "@/data/mockLockers";
import { useNavigate } from "react-router-dom";

const statusConfig: Record<LockerStatus, { color: string; icon: React.ReactNode; label: string; glowClass: string }> = {
  locked: { color: "text-primary", icon: <Lock className="w-5 h-5" />, label: "Locked", glowClass: "animate-pulse-green neon-glow-green" },
  open: { color: "text-warning", icon: <LockOpen className="w-5 h-5" />, label: "Open", glowClass: "neon-glow-yellow" },
  forced: { color: "text-destructive", icon: <AlertTriangle className="w-5 h-5" />, label: "Forced Entry", glowClass: "animate-pulse-red neon-glow-red" },
};

const LockerCard: React.FC<{ locker: Locker; index: number }> = ({ locker, index }) => {
  const navigate = useNavigate();
  const config = statusConfig[locker.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/locker/${locker.id}`)}
      className="glass-card p-4 cursor-pointer hover:border-primary/30 transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${locker.status === "locked" ? "bg-primary/15" : locker.status === "open" ? "bg-warning/15" : "bg-destructive/15"} ${config.glowClass}`}>
            <span className={config.color}>{config.icon}</span>
          </div>
          <div>
            <p className="text-foreground font-medium text-sm">{locker.name}</p>
            <p className="text-muted-foreground text-xs">{locker.number}</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
        <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Battery className={`w-3 h-3 ${locker.battery < 50 ? "text-warning" : "text-muted-foreground"}`} />
            <span className="text-xs text-muted-foreground">{locker.battery}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Wifi className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{locker.signal}%</span>
          </div>
          <span className="text-xs text-muted-foreground">{locker.lastUpdated}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default LockerCard;
