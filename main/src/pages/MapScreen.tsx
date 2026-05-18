import React from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { mockLockers } from "@/data/mockLockers";

const MapScreen: React.FC = () => {
  return (
    <div className="min-h-screen gradient-bg pb-24">
      <div className="px-5 pt-12 pb-6">
        <h1 className="text-xl font-display font-bold text-foreground">Map</h1>
        <p className="text-xs text-muted-foreground mt-1">Locker locations</p>
      </div>

      <div className="px-5">
        {/* Simulated map */}
        <div className="glass-card p-6 h-64 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 40%, hsl(145 80% 50% / 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 60%, hsl(0 72% 55% / 0.2) 0%, transparent 50%)" }} />
          <div className="text-center z-10">
            <MapPin className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Map integration coming soon</p>
            <p className="text-xs text-muted-foreground mt-1">Connect to enable live location tracking</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {mockLockers.map((locker, i) => (
            <motion.div
              key={locker.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-3 flex items-center gap-3"
            >
              <MapPin className={`w-4 h-4 ${locker.status === "locked" ? "text-primary" : locker.status === "open" ? "text-warning" : "text-destructive"}`} />
              <div>
                <p className="text-foreground text-sm">{locker.name}</p>
                <p className="text-xs text-muted-foreground">{locker.number}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapScreen;
