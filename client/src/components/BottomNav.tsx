import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Home, Users, TrendingUp, Share2, MessageCircle, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export const BottomNav: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { role } = useUserRole();

  // Role-based navigation
  const getNavItems = () => {
    if (!isAuthenticated) {
      return [
        { path: "/", label: "Home", icon: Home },
        { path: "/institutional", label: "For Providers", icon: Users },
        { path: "/parent-safe-truth", label: "For Parents", icon: MessageCircle },
      ];
    }

    if (role === "provider") {
      return [
        { path: "/", label: "Home", icon: Home },
        { path: "/patients", label: "Patients", icon: Users },
        { path: "/performance-dashboard", label: "Performance", icon: BarChart3 },
        { path: "/referral", label: "Refer", icon: Share2 },
      ];
    }

    if (role === "institution") {
      return [
        { path: "/", label: "Home", icon: Home },
        { path: "/hospital-admin-dashboard", label: "Dashboard", icon: BarChart3 },
        { path: "/institutional-portal", label: "Staff", icon: Users },
      ];
    }

    if (role === "parent") {
      return [
        { path: "/", label: "Home", icon: Home },
        { path: "/learner-dashboard", label: "Learning", icon: MessageCircle },
        { path: "/personal-impact", label: "Impact", icon: TrendingUp },
      ];
    }

    // Default
    return [
      { path: "/", label: "Home", icon: Home },
      { path: "/personal-impact", label: "Impact", icon: TrendingUp },
      { path: "/referral", label: "Refer", icon: Share2 },
    ];
  };

  const navItems = getNavItems();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#1a4d4d] z-40 md:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 p-2 rounded-lg transition-colors flex-1",
                active
                  ? "text-[#1a4d4d] bg-orange-50"
                  : "text-gray-600 hover:text-[#1a4d4d] hover:bg-orange-50"
              )}
              aria-label={item.label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
