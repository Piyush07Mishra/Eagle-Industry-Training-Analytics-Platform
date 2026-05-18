import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, User, Wifi, Plus, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { mockLockers, mockAlerts } from "@/data/mockLockers";
import LockerCard from "@/components/LockerCard";

const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const unreadAlerts = mockAlerts.filter((a) => !a.dismissed).length;

  return (
    <div className="min-h-screen gradient-bg pb-24 relative">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs">Welcome back,</p>
            <h1 className="text-xl font-display font-bold text-foreground">{user?.fullName || "User"}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
              <Wifi className="w-3 h-3 text-primary" />
              <span className="text-xs text-primary font-medium">Online</span>
            </div>
            <div className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadAlerts > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold"
                >
                  {unreadAlerts}
                </motion.span>
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: mockLockers.length, color: "text-foreground" },
            { label: "Locked", value: mockLockers.filter((l) => l.status === "locked").length, color: "text-primary" },
            { label: "Alerts", value: unreadAlerts, color: "text-destructive" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-3 text-center"
            >
              <p className={`text-2xl font-display font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lockers */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-display font-semibold text-foreground">My Lockers</h2>
          <span className="text-xs text-muted-foreground">{mockLockers.length} devices</span>
        </div>
        <div className="space-y-3">
          {mockLockers.map((locker, i) => (
            <LockerCard key={locker.id} locker={locker} index={i} />
          ))}
        </div>
      </div>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-2xl bg-primary flex items-center justify-center z-40"
        style={{ boxShadow: "0 0 30px hsl(145 80% 50% / 0.3)" }}
      >
        <Plus className="w-6 h-6 text-primary-foreground" />
      </motion.button>

      {/* Add Locker Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg glass-card rounded-t-3xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-display font-bold text-foreground">Add New Locker</h3>
                <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <input placeholder="Locker Name" className="w-full glass-input px-4 py-3 text-sm" />
                <input placeholder="Locker ID / Serial" className="w-full glass-input px-4 py-3 text-sm" />
                <input placeholder="Location" className="w-full glass-input px-4 py-3 text-sm" />
                <motion.button whileTap={{ scale: 0.97 }} className="w-full btn-primary py-3 text-sm" onClick={() => setShowAddModal(false)}>
                  Add Locker
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardScreen;
