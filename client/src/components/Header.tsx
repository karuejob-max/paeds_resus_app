import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, LogOut, Bell, Settings, Stethoscope, Heart, Briefcase, Shield } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { role, setUserRole } = useUserRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
    };

    if (accountDropdownOpen || roleDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [accountDropdownOpen, roleDropdownOpen]);

  // Sync role from userType when authenticated and role not set (e.g. after login)
  useEffect(() => {
    if (!isAuthenticated || !user?.userType || role) return;
    const map: Record<string, "provider" | "parent" | "institution"> = {
      individual: "provider",
      parent: "parent",
      institutional: "institution",
    };
    const r = map[user.userType];
    if (r) setUserRole(r);
  }, [isAuthenticated, user?.userType, role, setUserRole]);

  // Get navigation based on role — Dashboard first so provider/parent/institution can get home
  const getNavigation = () => {
    if (role === "provider") {
      return [
        { label: "Dashboard", href: "/home", icon: "🏠" },
        { label: "Patients", href: "/patients", icon: "👥" },
        { label: "Protocols", href: "/protocols", icon: "📋" },
        { label: "Performance", href: "/performance-dashboard", icon: "🏆" },
        { label: "Safe-Truth", href: "/safe-truth", icon: "🚨" },
        { label: "Referral", href: "/referral", icon: "📤" },
        { label: "Personal Impact", href: "/personal-impact", icon: "📊" },
      ];
    }
    if (role === "institution") {
      return [
        { label: "Dashboard", href: "/hospital-admin-dashboard", icon: "📊" },
        { label: "Staff", href: "/institutional-portal", icon: "👥" },
        { label: "Analytics", href: "/advanced-analytics", icon: "📈" },
      ];
    }
    if (role === "parent") {
      return [
        { label: "Dashboard", href: "/parent-safe-truth", icon: "🏠" },
        { label: "Courses", href: "/learner-dashboard", icon: "📚" },
        { label: "Resources", href: "/parent-safe-truth", icon: "📖" },
      ];
    }
    return [];
  };

  const baseNav = getNavigation();
  const navigation =
    isAuthenticated && (user as { role?: string })?.role === "admin"
      ? [...baseNav, { label: "Admin", href: "/admin", icon: "🛡️" }]
      : baseNav;

  const roleOptions = [
    { value: "provider", label: "Healthcare Provider", icon: Stethoscope },
    { value: "parent", label: "Parent/Caregiver", icon: Heart },
    { value: "institution", label: "Institution", icon: Briefcase },
  ];

  // Keyboard: Escape closes dropdowns
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setRoleDropdownOpen(false);
        setAccountDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200" role="banner" aria-label="Site header">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition flex-shrink-0 focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg">
              <img src="/paeds-resus-logo.png" alt="Paeds Resus" className="w-10 h-10 rounded-lg object-contain ring-1 ring-gray-200/80" />
              <span className="font-bold text-base text-gray-900 hidden sm:inline">Paeds Resus</span>
            </div>
          </Link>

          {/* Role Selector - Persistent and Prominent */}
          {isAuthenticated && role && (
            <div className="relative hidden md:block flex-shrink-0" ref={roleDropdownRef}>
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                aria-haspopup="true"
                aria-expanded={roleDropdownOpen}
                aria-label={`Switch role (current: ${role})`}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition text-sm font-medium border border-gray-200 focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                {role === "provider" && <Stethoscope className="w-4 h-4" />}
                {role === "parent" && <Heart className="w-4 h-4" />}
                {role === "institution" && <Briefcase className="w-4 h-4" />}
                <span className="capitalize">{role}</span>
                <ChevronDown className={`w-4 h-4 transition ${roleDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {roleDropdownOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10" role="listbox" aria-label="Role options">
                  <div className="p-2">
                    {roleOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          type="button"
                          key={option.value}
                          role="option"
                          aria-selected={role === option.value}
                          onClick={() => {
                            const r = option.value as "provider" | "parent" | "institution";
                            setUserRole(r);
                            setRoleDropdownOpen(false);
                            if (r === "provider") setLocation("/home");
                            else if (r === "parent") setLocation("/parent-safe-truth");
                            else setLocation("/institutional-portal");
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition text-sm ${
                            role === option.value
                              ? "bg-blue-50 text-blue-700 font-medium"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Desktop Navigation - Only Essential Items */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 ml-4" aria-label="Main navigation">
            {navigation.map((link) => (
              <Link key={link.href} href={link.href}>
                <span className="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer text-sm font-medium rounded-lg">
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* Right Section: Notifications + Account */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Notifications */}
            {isAuthenticated && (
              <button type="button" className="p-2 hover:bg-gray-100 rounded-lg transition hidden sm:block focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2" aria-label="Notifications">
                <Bell className="w-5 h-5 text-gray-700" />
              </button>
            )}

            {/* Auth Section */}
            {isAuthenticated ? (
              <div className="relative" ref={accountDropdownRef}>
                <button
                  type="button"
                  onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                  aria-haspopup="true"
                  aria-expanded={accountDropdownOpen}
                  aria-label="Account menu"
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition text-sm font-medium focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className={`w-4 h-4 transition ${accountDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {accountDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10" role="menu" aria-label="Account options">
                    <div className="p-3">
                      {/* User Info */}
                      <div className="px-3 py-2 border-b">
                        <p className="font-semibold text-sm text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>

                      {/* Quick Links — role-aware Dashboard */}
                      <div className="py-2 space-y-1">
                        <Link href={role === "parent" ? "/parent-safe-truth" : role === "institution" ? "/hospital-admin-dashboard" : "/home"}>
                          <div
                            className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer rounded"
                            onClick={() => setAccountDropdownOpen(false)}
                          >
                            Dashboard
                          </div>
                        </Link>
                        <Link href="/provider-profile">
                          <div
                            className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer rounded"
                            onClick={() => setAccountDropdownOpen(false)}
                          >
                            Profile
                          </div>
                        </Link>
                        {(user as { role?: string })?.role === "admin" && (
                          <Link href="/admin">
                            <div
                              className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer rounded flex items-center gap-2"
                              onClick={() => setAccountDropdownOpen(false)}
                            >
                              <Shield className="h-4 w-4" />
                              Admin
                            </div>
                          </Link>
                        )}
                      </div>

                      {/* Logout */}
                      <div className="border-t pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setAccountDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition cursor-pointer rounded flex items-center gap-2 focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                          aria-label="Log out"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <a href={getLoginUrl()}>
                  <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-100 text-xs">
                    Sign In
                  </Button>
                </a>
                <a href={getLoginUrl()} className="hidden sm:block">
                  <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
                    Get Started
                  </Button>
                </a>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="lg:hidden p-2 focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden mt-4 space-y-1 pb-4 border-t pt-4" aria-label="Mobile navigation">
            {/* Mobile Role Selector */}
            {isAuthenticated && role && (
              <div className="px-3 py-2 mb-3 border-b pb-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">Switch Role:</p>
                <div className="space-y-1">
                  {roleOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        const r = option.value as "provider" | "parent" | "institution";
                        setUserRole(r);
                        setMobileMenuOpen(false);
                        if (r === "provider") setLocation("/home");
                        else if (r === "parent") setLocation("/parent-safe-truth");
                        else setLocation("/institutional-portal");
                      }}
                      className={`w-full text-left px-3 py-2 rounded text-sm ${
                        role === option.value
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile Navigation Links */}
            {navigation.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition cursor-pointer font-medium text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
