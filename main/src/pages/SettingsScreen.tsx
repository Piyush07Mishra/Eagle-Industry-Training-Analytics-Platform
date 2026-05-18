import React, { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Volume2, Moon, LogOut, Shield, Phone, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);
  const [adminMode, setAdminMode] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const Toggle: React.FC<{ on: boolean; onToggle: () => void }> = ({ on, onToggle }) => (
    <button onClick={onToggle} className={`w-11 h-6 rounded-full transition-colors relative ${on ? "bg-primary" : "bg-muted"}`}>
      <motion.div
        animate={{ x: on ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="w-5 h-5 rounded-full bg-foreground absolute top-0.5"
      />
    </button>
  );

  return (
    <div className="min-h-screen gradient-bg pb-24">
      <div className="px-5 pt-12 pb-6">
        <h1 className="text-xl font-display font-bold text-foreground">Settings</h1>
      </div>

      {/* Profile */}
      <div className="px-5 mb-6">
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
            {user?.fullName?.[0] || "U"}
          </div>
          <div>
            <p className="text-foreground font-medium">{user?.fullName || "User"}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-3">
        {/* Toggles */}
        {[
          { icon: <Bell className="w-4 h-4" />, label: "Notifications", value: notifications, toggle: () => setNotifications(!notifications) },
          { icon: <Volume2 className="w-4 h-4" />, label: "Sound / Buzzer", value: sound, toggle: () => setSound(!sound) },
          { icon: <Shield className="w-4 h-4" />, label: "Admin Mode", value: adminMode, toggle: () => setAdminMode(!adminMode) },
        ].map((item) => (
          <div key={item.label} className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">{item.icon}</span>
              <span className="text-foreground text-sm">{item.label}</span>
            </div>
            <Toggle on={item.value} onToggle={item.toggle} />
          </div>
        ))}

        {/* Emergency Contact */}
        <motion.button whileTap={{ scale: 0.98 }} className="glass-card p-4 flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-destructive" />
            <span className="text-foreground text-sm">Emergency Contact</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </motion.button>

        {/* Logout */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          className="w-full btn-destructive py-3.5 text-sm flex items-center justify-center gap-2 mt-6"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </motion.button>
      </div>
    </div>
  );
};

export default SettingsScreen;
