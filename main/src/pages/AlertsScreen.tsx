import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Battery, Wifi, X, ShieldAlert } from "lucide-react";
import { mockAlerts, Alert } from "@/data/mockLockers";

const alertIcon: Record<string, React.ReactNode> = {
  forced_entry: <ShieldAlert className="w-5 h-5 text-destructive" />,
  low_battery: <Battery className="w-5 h-5 text-warning" />,
  connection_lost: <Wifi className="w-5 h-5 text-warning" />,
  tamper: <AlertTriangle className="w-5 h-5 text-destructive" />,
};

const AlertsScreen: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);

  const dismiss = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, dismissed: true } : a)));
  };

  const active = alerts.filter((a) => !a.dismissed);
  const dismissed = alerts.filter((a) => a.dismissed);

  return (
    <div className="min-h-screen gradient-bg pb-24">
      <div className="px-5 pt-12 pb-6">
        <h1 className="text-xl font-display font-bold text-foreground">Alerts</h1>
        <p className="text-xs text-muted-foreground mt-1">{active.length} active alerts</p>
      </div>

      <div className="px-5 space-y-3">
        {active.length === 0 && (
          <div className="glass-card p-8 text-center">
            <p className="text-muted-foreground text-sm">No active alerts 🎉</p>
          </div>
        )}
        <AnimatePresence>
          {active.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30, height: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`glass-card p-4 border-l-4 ${
                alert.type === "forced_entry" || alert.type === "tamper" ? "border-l-destructive" : "border-l-warning"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {alertIcon[alert.type]}
                  <div>
                    <p className="text-foreground text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.lockerNumber} · {alert.timestamp}</p>
                  </div>
                </div>
                <button onClick={() => dismiss(alert.id)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {dismissed.length > 0 && (
          <div className="mt-6">
            <p className="text-xs text-muted-foreground mb-3">Dismissed</p>
            {dismissed.map((alert) => (
              <div key={alert.id} className="glass-card p-3 mb-2 opacity-50">
                <div className="flex items-center gap-3">
                  {alertIcon[alert.type]}
                  <div>
                    <p className="text-foreground text-xs">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsScreen;
