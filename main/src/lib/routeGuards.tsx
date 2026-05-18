import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Role-based navigation guards - keys MUST match UserRole type (ADMIN, TRAINER, etc.)
export const getRoleBasedDashboard = (role: UserRole): string => {
  const dashboards: Record<UserRole, string> = {
    ADMIN: "/admin/dashboard",
    TRAINER: "/trainer/dashboard",
    TRAINEE: "/trainee/dashboard",
    CLIENT: "/client/dashboard",
  };
  return dashboards[role];
};

export interface MenuItem {
  label: string;
  path: string;
  icon: string;
}

export const getRoleBaseNavigation = (role: UserRole): MenuItem[] => {
  const navItems: Record<UserRole, MenuItem[]> = {
    ADMIN: [
      { label: "Dashboard", path: "/admin/dashboard", icon: "LayoutDashboard" },
      {
        label: "Training Management",
        path: "/admin/training",
        icon: "BookOpen",
      },
      {
        label: "Analytics & Reports",
        path: "/admin/analytics",
        icon: "BarChart3",
      },
      { label: "Feedback", path: "/admin/feedback", icon: "MessageSquare" },
    ],
    TRAINER: [
      { label: "Dashboard", path: "/trainer/dashboard", icon: "LayoutDashboard" },
      {
        label: "Training Management",
        path: "/trainer/training",
        icon: "BookOpen",
      },
      { label: "Quiz Builder", path: "/trainer/quiz-builder", icon: "PenTool" },
      { label: "Schedule", path: "/trainer/schedule", icon: "Calendar" },
    ],
    TRAINEE: [
      { label: "Dashboard", path: "/trainee/dashboard", icon: "LayoutDashboard" },
      {
        label: "Report Card",
        path: "/trainee/report-card",
        icon: "Award",
      },
      {
        label: "Available Sessions",
        path: "/trainee/sessions/available",
        icon: "BookOpen",
      },
      {
        label: "Upcoming Sessions",
        path: "/trainee/sessions/upcoming",
        icon: "Calendar",
      },
      {
        label: "Completed Sessions",
        path: "/trainee/sessions/completed",
        icon: "CheckCircle",
      },
      { label: "Attendance", path: "/trainee/attendance", icon: "Eye" },
      { label: "Feedback", path: "/trainee/feedback", icon: "MessageSquare" },
    ],
    CLIENT: [
      { label: "Dashboard", path: "/client/dashboard", icon: "LayoutDashboard" },
      {
        label: "Analytics & Reports",
        path: "/client/analytics",
        icon: "BarChart3",
      },
    ],
  };
  return navItems[role] || [];
};
