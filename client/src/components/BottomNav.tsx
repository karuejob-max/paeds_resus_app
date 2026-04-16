import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Home, Users, TrendingUp, Share2, MessageCircle, BarChart3, BookOpen, Siren, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

export const BottomNav: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { role } = useUserRole();

  // Role-based navigation
  const getNavItems = () => {
    if (!isAuthenticated) {
      return [
        { path: "/start", label: "Start", icon: Compass },
        { path: "/resus", label: "Resus", icon: Siren },
        { path: "/institutional", label: "Hospitals", icon: Users },
        { path: "/parent-safe-truth", label: "Parents", icon: MessageCircle },
      ];
    }

    if (role === "provider") {
      // HI-PLAT-4: Clinical thumb-nav — ResusGPS + protocols + referral (hub is /home)
      return [
        { path: "/home", label: "Hub", icon: Home },
        { path: "/resus", label: "Resus", icon: Siren },
        { path: "/protocols", label: "Protocols", icon: BookOpen },
        { path: "/referral", label: "Refer", icon: Share2 },
      ];
    }

    if (role === "institution") {
      return [
        { path: "/hospital-admin-dashboard", label: "Home", icon: Home },
        { path: "/hospital-admin-dashboard", label: "Dashboard", icon: BarChart3 },
        { path: "/advanced-analytics", label: "Analytics", icon: Users },
      ];
    }

    if (role === "parent") {
      return [
        { path: "/parent-safe-truth", label: "Home", icon: Home },
        { path: "/parent-safe-truth", label: "Stories", icon: MessageCircle },
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
