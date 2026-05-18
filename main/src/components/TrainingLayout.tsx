import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  BookOpen,
  BarChart3,
  MessageSquare,
  Settings,
  Calendar,
  CheckCircle,
  Eye,
  ChevronRight,
  Award,
} from "lucide-react";
import { getRoleBaseNavigation } from "@/lib/routeGuards";
import { cn } from "@/lib/utils";

const TrainingNavBar: React.FC<{ isOpen: boolean; toggle: () => void }> = ({
  isOpen,
  toggle,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg sticky top-0 z-20">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="lg:hidden p-1.5 hover:bg-white/20 rounded-lg transition"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold hidden sm:block">Training System</h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-xs text-blue-100">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 hover:bg-white/20 rounded-lg transition"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};

interface TrainingLayoutProps {
  children: React.ReactNode;
}

const TrainingLayout: React.FC<TrainingLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const navItems = user ? getRoleBaseNavigation(user.role) : [];

  const getIcon = (iconName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      LayoutDashboard: <LayoutDashboard className="w-5 h-5" />,
      BookOpen: <BookOpen className="w-5 h-5" />,
      BarChart3: <BarChart3 className="w-5 h-5" />,
      MessageSquare: <MessageSquare className="w-5 h-5" />,
      Settings: <Settings className="w-5 h-5" />,
      Calendar: <Calendar className="w-5 h-5" />,
      CheckCircle: <CheckCircle className="w-5 h-5" />,
      Eye: <Eye className="w-5 h-5" />,
      Award: <Award className="w-5 h-5" />,
    };
    return iconMap[iconName] || null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <TrainingNavBar isOpen={sidebarOpen} toggle={toggleSidebar} />

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "bg-gray-900 text-white w-64 fixed lg:relative lg:translate-x-0 h-[calc(100vh-64px)] transition-transform duration-300 z-10 overflow-y-auto",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <nav className="p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4 px-2">
              Navigation
            </p>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                path={item.path}
                label={item.label}
                icon={getIcon(item.icon)}
                isActive={location.pathname === item.path}
              />
            ))}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 lg:hidden z-5"
            onClick={toggleSidebar}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 w-full overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

interface NavLinkProps {
  path: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ path, label, icon, isActive }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(path)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
        isActive
          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
          : "text-gray-300 hover:bg-gray-800 hover:text-white"
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1 text-left text-sm font-medium">{label}</span>
      {isActive && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
    </button>
  );
};

export default TrainingLayout;
