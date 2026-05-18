import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, BookOpen, Clock, Calendar, PenTool,
  CheckCircle, MessageSquare, Award, BarChart3, Trophy,
  FileText, ShieldCheck, Users, LogOut, Menu, ChevronRight
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

type NavItem = { label: string; icon: React.ElementType; path: string };

const ROLE_NAV: Record<string, NavItem[]> = {
  ADMIN: [
    { label: "Dashboard",           icon: LayoutDashboard, path: "/admin/dashboard" },
    { label: "Training Management", icon: BookOpen,         path: "/admin/training" },
    { label: "Analytics",           icon: BarChart3,        path: "/admin/analytics" },
    { label: "Feedback",            icon: MessageSquare,    path: "/admin/feedback" },
    { label: "Compliance Map",      icon: ShieldCheck,      path: "/admin/compliance" },
  ],
  TRAINER: [
    { label: "Dashboard",           icon: LayoutDashboard, path: "/trainer/dashboard" },
    { label: "👥 Trainees",          icon: Users,           path: "/trainer/trainees" },
    { label: "Training Management", icon: BookOpen,         path: "/trainer/training" },
    { label: "Quiz Builder",        icon: PenTool,          path: "/trainer/quiz-builder" },
    { label: "Schedule",            icon: Calendar,         path: "/trainer/schedule" },
    { label: "Leaderboard",         icon: Trophy,           path: "/trainer/leaderboard" },
  ],
  TRAINEE: [
    { label: "Dashboard",           icon: LayoutDashboard, path: "/trainee/dashboard" },
    { label: "Report Card",         icon: FileText,         path: "/trainee/report-card" },
    { label: "Available Sessions",  icon: BookOpen,         path: "/trainee/sessions/available" },
    { label: "Upcoming Sessions",   icon: Clock,            path: "/trainee/sessions/upcoming" },
    { label: "Completed Sessions",  icon: CheckCircle,      path: "/trainee/sessions/completed" },
    { label: "Attendance",          icon: Calendar,         path: "/trainee/attendance" },
    { label: "Feedback",            icon: MessageSquare,    path: "/trainee/feedback" },
    { label: "Certificates",        icon: Award,            path: "/trainee/certificates" },
  ],
  CLIENT: [
    { label: "Dashboard",           icon: LayoutDashboard, path: "/client/dashboard" },
    { label: "Compliance Report",   icon: ShieldCheck,      path: "/client/compliance" },
  ],
};

const getRoleColor = (role: string) => {
  switch (role) {
    case "ADMIN":   return "bg-purple-600";
    case "TRAINER": return "bg-blue-600";
    case "TRAINEE": return "bg-green-600";
    case "CLIENT":  return "bg-orange-600";
    default:        return "bg-slate-600";
  }
};

export const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate("/login"); };
  const menuItems = ROLE_NAV[user?.role || ""] || [];
  const roleColor = getRoleColor(user?.role || "");

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Logo */}
      <div className="p-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 ${roleColor} rounded-lg flex items-center justify-center font-bold text-sm shrink-0`}>
            LMS
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-white truncate">Eagle Training</h2>
            <p className="text-xs text-slate-400 truncate">{user?.employee_id} · {user?.role}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active
                  ? `${roleColor} text-white font-medium shadow-lg`
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-slate-700/50">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-medium text-white truncate">{user?.name}</p>
          <p className="text-xs text-slate-400 truncate">{user?.department || user?.site_location}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 h-full shrink-0 shadow-xl z-10">
        <div className="w-full"><SidebarContent /></div>
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="p-2 bg-white rounded-lg shadow-md border border-slate-200"
              aria-label="Open navigation menu"
              title="Open navigation menu"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-none w-64 bg-slate-900">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
              <SheetDescription>Primary navigation menu</SheetDescription>
            </SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <main className="p-6 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
