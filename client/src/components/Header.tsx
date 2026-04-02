import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, LogOut, Bell, Settings, Stethoscope, Heart, Briefcase, Shield } from "lucide-react";
import { getLoginUrl } from "@/const";
import { ThemeToggle } from "@/components/ThemeToggle";

/** ResusGPS — canonical route for the bedside tool (see PLATFORM_SOURCE_OF_TRUTH §5). */
const RESUS_GPS_NAV = { label: "ResusGPS", href: "/resus", icon: "⚡" } as const;

function mapUserTypeToHeaderRole(ut: string | null | undefined): "provider" | "parent" | "institution" | null {
  if (!ut) return null;
  const m: Record<string, "provider" | "parent" | "institution"> = {
    individual: "provider",
    parent: "parent",
    institutional: "institution",
  };
  return m[ut] ?? null;
}

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { role, setUserRole } = useUserRole();
  const effectiveRole = useMemo(
    () => (isAuthenticated ? role ?? mapUserTypeToHeaderRole(user?.userType) : null),
    [isAuthenticated, role, user?.userType]
  );
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
    const r = effectiveRole;
    if (r === "provider") {
      return [
        RESUS_GPS_NAV,
        { label: "Dashboard", href: "/home", icon: "🏠" },
        { label: "Instructor", href: "/instructor-portal", icon: "🎓" },
        { label: "Patients", href: "/patients", icon: "👥" },
        { label: "Protocols", href: "/protocols", icon: "📋" },
        { label: "Performance", href: "/performance-dashboard", icon: "🏆" },
        { label: "Safe-Truth", href: "/safe-truth", icon: "🚨" },
        { label: "Referral", href: "/referral", icon: "📤" },
        { label: "Personal Impact", href: "/personal-impact", icon: "📊" },
      ];
    }
    if (r === "institution") {
      return [
        RESUS_GPS_NAV,
        { label: "Dashboard", href: "/hospital-admin-dashboard", icon: "📊" },
        { label: "Staff", href: "/institutional-portal", icon: "👥" },
        { label: "Analytics", href: "/advanced-analytics", icon: "📈" },
      ];
    }
    if (r === "parent") {
      return [
        RESUS_GPS_NAV,
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
    <header
      className="bg-background shadow-sm sticky top-0 z-50 border-b border-border"
      role="banner"
      aria-label="Site header"
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo + theme */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition flex-shrink-0 focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg">
                <img
                  src="/favicon.png"
                  alt="Paeds Resus"
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-lg object-cover shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/paeds-resus-logo-brand.png";
                  }}
                />
                <span className="font-bold text-base text-foreground tracking-tight">Paeds Resus</span>
              </div>
            </Link>
            <ThemeToggle />
          </div>

          {/* Role Selector - Persistent and Prominent */}
          {isAuthenticated && effectiveRole && (
            <div className="relative hidden md:block flex-shrink-0" ref={roleDropdownRef}>
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                aria-haspopup="true"
                aria-expanded={roleDropdownOpen}
                aria-label={`Switch role (current: ${effectiveRole})`}
                className="flex items-center gap-2 px-3 py-2 text-foreground hover:bg-accent rounded-lg transition text-sm font-medium border border-border focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {effectiveRole === "provider" && <Stethoscope className="w-4 h-4" />}
                {effectiveRole === "parent" && <Heart className="w-4 h-4" />}
                {effectiveRole === "institution" && <Briefcase className="w-4 h-4" />}
                <span className="capitalize">{effectiveRole}</span>
                <ChevronDown className={`w-4 h-4 transition ${roleDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {roleDropdownOpen && (
                <div
                  className="absolute left-0 mt-2 w-56 bg-popover text-popover-foreground rounded-lg shadow-lg border border-border z-10"
                  role="listbox"
                  aria-label="Role options"
                >
                  <div className="p-2">
                    {roleOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          type="button"
                          key={option.value}
                          role="option"
                          aria-selected={effectiveRole === option.value}
                          onClick={() => {
                            const r = option.value as "provider" | "parent" | "institution";
                            setUserRole(r);
                            setRoleDropdownOpen(false);
                            if (r === "provider") setLocation("/home");
                            else if (r === "parent") setLocation("/parent-safe-truth");
                            else setLocation("/institutional-portal");
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition text-sm ${
                            effectiveRole === option.value
                              ? "bg-accent text-foreground font-medium"
                              : "text-foreground/90 hover:bg-muted"
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
                <span className="px-3 py-2 text-foreground/90 hover:text-primary hover:bg-accent transition cursor-pointer text-sm font-medium rounded-lg">
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* Anonymous quick paths (P2-LAND-1 light touch) */}
          {!isAuthenticated && (
            <nav
              className="hidden md:flex items-center gap-1 text-sm text-muted-foreground mr-2"
              aria-label="Explore by audience"
            >
              <Link href="/resus">
                <span className="px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer font-medium text-foreground">
                  ResusGPS
                </span>
              </Link>
              <Link href="/start">
                <span className="px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer font-medium text-foreground">
                  Start
                </span>
              </Link>
              <Link href="/parent-safe-truth">
                <span className="px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer">Parents</span>
              </Link>
              <Link href="/institutional">
                <span className="px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer">Institutions</span>
              </Link>
              <Link href="/help">
                <span className="px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer">Help</span>
              </Link>
            </nav>
          )}

          {/* Right Section: Notifications + Account */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Notifications */}
            {isAuthenticated && (
              <button
                type="button"
                className="p-2 hover:bg-accent rounded-lg transition hidden sm:block focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-foreground" />
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
                  className="flex items-center gap-2 px-3 py-2 text-foreground hover:bg-accent rounded-lg transition text-sm font-medium focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className={`w-4 h-4 transition ${accountDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {accountDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-popover text-popover-foreground rounded-lg shadow-lg border border-border z-10"
                    role="menu"
                    aria-label="Account options"
                  >
                    <div className="p-3">
                      {/* User Info */}
                      <div className="px-3 py-2 border-b border-border">
                        <p className="font-semibold text-sm text-foreground">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>

                      {/* Quick Links — role-aware Dashboard */}
                      <div className="py-2 space-y-1">
                        <Link href={effectiveRole === "parent" ? "/parent-safe-truth" : effectiveRole === "institution" ? "/hospital-admin-dashboard" : "/home"}>
                          <div
                            className="px-3 py-2 text-sm text-foreground hover:bg-accent transition cursor-pointer rounded"
                            onClick={() => setAccountDropdownOpen(false)}
                          >
                            Dashboard
                          </div>
                        </Link>
                        <Link href="/resus">
                          <div
                            className="px-3 py-2 text-sm text-foreground hover:bg-accent transition cursor-pointer rounded"
                            onClick={() => setAccountDropdownOpen(false)}
                          >
                            ResusGPS
                          </div>
                        </Link>
                        <Link href="/provider-profile">
                          <div
                            className="px-3 py-2 text-sm text-foreground hover:bg-accent transition cursor-pointer rounded"
                            onClick={() => setAccountDropdownOpen(false)}
                          >
                            Profile
                          </div>
                        </Link>
                        {(user as { role?: string })?.role === "admin" && (
                          <Link href="/admin">
                            <div
                              className="px-3 py-2 text-sm text-foreground hover:bg-accent transition cursor-pointer rounded flex items-center gap-2"
                              onClick={() => setAccountDropdownOpen(false)}
                            >
                              <Shield className="h-4 w-4" />
                              Admin
                            </div>
                          </Link>
                        )}
                      </div>

                      {/* Logout */}
                      <div className="border-t border-border pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setAccountDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition cursor-pointer rounded flex items-center gap-2 focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                  <Button variant="outline" size="sm" className="text-xs">
                    Sign In
                  </Button>
                </a>
                <Link href="/start" className="hidden sm:block">
                  <Button variant="cta" size="sm">
                    Get started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="lg:hidden p-2 text-foreground focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
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
          <nav className="lg:hidden mt-4 space-y-1 pb-4 border-t border-border pt-4" aria-label="Mobile navigation">
            {!isAuthenticated && (
              <div className="px-3 py-2 mb-2 space-y-1 border-b border-border pb-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Explore</p>
                <Link href="/resus" onClick={() => setMobileMenuOpen(false)}>
                  <span className="block py-2 text-sm text-foreground font-medium">ResusGPS</span>
                </Link>
                <Link href="/start" onClick={() => setMobileMenuOpen(false)}>
                  <span className="block py-2 text-sm text-foreground font-medium">Start</span>
                </Link>
                <Link href="/parent-safe-truth" onClick={() => setMobileMenuOpen(false)}>
                  <span className="block py-2 text-sm text-foreground/90">Parents</span>
                </Link>
                <Link href="/institutional" onClick={() => setMobileMenuOpen(false)}>
                  <span className="block py-2 text-sm text-foreground/90">Institutions</span>
                </Link>
                <Link href="/help" onClick={() => setMobileMenuOpen(false)}>
                  <span className="block py-2 text-sm text-foreground/90">Help</span>
                </Link>
              </div>
            )}
            {/* Mobile Role Selector */}
            {isAuthenticated && effectiveRole && (
              <div className="px-3 py-2 mb-3 border-b border-border pb-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Switch Role:</p>
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
                        effectiveRole === option.value
                          ? "bg-accent text-foreground font-medium"
                          : "text-foreground/90 hover:bg-muted"
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
                  className="block px-3 py-2 text-foreground/90 hover:bg-accent hover:text-primary rounded transition cursor-pointer font-medium text-sm"
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
