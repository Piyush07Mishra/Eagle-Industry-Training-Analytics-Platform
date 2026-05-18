import React from "react";
import { motion } from "framer-motion";
import { Lock, LockOpen, AlertTriangle, Battery, Volume2, VolumeX } from "lucide-react";
import { mockActivity, ActivityEvent } from "@/data/mockLockers";

const eventConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  lock: { icon: <Lock className="w-4 h-4" />, color: "text-primary bg-primary/10", label: "Locked" },
  unlock: { icon: <LockOpen className="w-4 h-4" />, color: "text-warning bg-warning/10", label: "Unlocked" },
  forced_entry: { icon: <AlertTriangle className="w-4 h-4" />, color: "text-destructive bg-destructive/10", label: "Forced Entry" },
  battery_low: { icon: <Battery className="w-4 h-4" />, color: "text-warning bg-warning/10", label: "Low Battery" },
  buzzer_on: { icon: <Volume2 className="w-4 h-4" />, color: "text-destructive bg-destructive/10", label: "Buzzer On" },
  buzzer_off: { icon: <VolumeX className="w-4 h-4" />, color: "text-muted-foreground bg-muted", label: "Buzzer Off" },
};

const HistoryScreen: React.FC = () => {
  return (
    <div className="min-h-screen gradient-bg pb-24">
      <div className="px-5 pt-12 pb-6">
        <h1 className="text-xl font-display font-bold text-foreground">Activity History</h1>
        <p className="text-xs text-muted-foreground mt-1">{mockActivity.length} events</p>
      </div>

      <div className="px-5">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border/50" />

          <div className="space-y-4">
            {mockActivity.map((event, i) => {
              const config = eventConfig[event.type];
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-4 relative"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center z-10 ${config.color}`}>
                    {config.icon}
                  </div>
                  <div className="glass-card p-3 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-foreground text-sm font-medium">{config.label}</p>
                      <span className="text-xs text-muted-foreground">{event.lockerNumber}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{event.timestamp}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryScreen;
