import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, LogOut, Bell, Settings, Stethoscope, Briefcase, Shield } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { GlobalSearch } from "@/components/GlobalSearch";
import { getLoginUrl } from "@/const";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePrefetchAhaHub } from "@/hooks/usePrefetchAhaHub";
import { trpc } from "@/lib/trpc";

/** ResusGPS — canonical route for the bedside tool (see PLATFORM_SOURCE_OF_TRUTH §5). */
const RESUS_GPS_NAV = { label: "ResusGPS", href: "/resus", icon: "⚡" } as const;

function mapUserTypeToHeaderRole(ut: string | null | undefined): "provider" | "institution" | null {
  if (!ut) return null;
  const m: Record<string, "provider" | "institution"> = {
    individual: "provider",
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
  const [learnDropdownOpen, setLearnDropdownOpen] = useState(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const learnDropdownRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const prefetchAhaHub = usePrefetchAhaHub();

  // Instructor Portal only shows once someone is actually approved — see
  // instructor.getStatus.portalUnlocked (number + certified + admin-approved).
  const { data: instructorStatus } = trpc.instructor.getStatus.useQuery(undefined, {
    enabled: isAuthenticated && effectiveRole === "provider",
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (learnDropdownRef.current && !learnDropdownRef.current.contains(event.target as Node)) {
        setLearnDropdownOpen(false);
      }
    };

    if (accountDropdownOpen || roleDropdownOpen || learnDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [accountDropdownOpen, roleDropdownOpen, learnDropdownOpen]);

  // Sync role from userType when authenticated and role not set (e.g. after login)
  useEffect(() => {
    if (!isAuthenticated || !user?.userType || role) return;
    const map: Record<string, "provider" | "institution"> = {
      individual: "provider",
      institutional: "institution",
    };
    const r = map[user.userType];
    if (r) setUserRole(r);
  }, [isAuthenticated, user?.userType, role, setUserRole]);

  // Get navigation based on role — Dashboard first so provider/parent/institution can get home
  const getNavigation = () => {
    const r = effectiveRole;
    if (r === "provider") {
      const items: { label: string; href: string; icon: string; group?: "learn" }[] = [
        RESUS_GPS_NAV,
        { label: "Dashboard", href: "/home", icon: "🏠" },
        // Elevated to top-level (not grouped) — Care Signal is safety-critical
        // incident reporting, not a course; it shouldn't compete for attention
        // inside a "Learn" bucket the way Fellowship/AHA/CNE do.
        { label: "Care Signal", href: "/care-signal", icon: "🚨" },
        { label: "Fellowship", href: "/fellowship", icon: "📚", group: "learn" },
        { label: "Fellowship guide", href: "/fellowship/about", icon: "📖", group: "learn" },
        { label: "AHA", href: "/aha-courses", icon: "🩺", group: "learn" },
        { label: "My CNE", href: "/my-cne-certificates", icon: "📜", group: "learn" },
      ];
      if (instructorStatus?.portalUnlocked) {
        items.push({ label: "Instructor", href: "/instructor-portal", icon: "🎓" });
      }
      return items;
    }
    if (r === "institution") {
      return [
        { label: "Dashboard", href: "/hospital-admin-dashboard", icon: "📊" },
        { label: "Staff", href: "/hospital-admin-dashboard", icon: "👥" },
        { label: "Analytics", href: "/advanced-analytics", icon: "📈" },
      ];
    }
    return [];
  };

  const baseNav = getNavigation();
  const navigation =
    isAuthenticated && (user as { role?: string })?.role === "admin"
      ? [...baseNav, { label: "Admin", href: "/admin", icon: "🛡️" }]
      : baseNav;
  // Desktop-only split: everything NOT in the "learn" group renders as its own
  // top-level link; "learn" items collapse into one "Learn" dropdown so the
  // desktop row doesn't grow a new flat item every time a course type is added.
  // Mobile keeps rendering `navigation` as one flat list either way (below) —
  // this split only affects the `hidden lg:flex` row's layout, not what's
  // reachable on a phone.
  const primaryNavItems = navigation.filter((item) => item.group !== "learn");
  const learnNavItems = navigation.filter((item) => item.group === "learn");

  const roleOptions = [
    { value: "provider", label: "Individual", icon: Stethoscope },
    { value: "institution", label: "Institution", icon: Briefcase },
  ];
  const roleDisplayLabel: Record<"provider" | "institution", string> = {
    provider: "Individual",
    institution: "Institution",
  };

  // Keyboard: Escape closes dropdowns
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setRoleDropdownOpen(false);
        setAccountDropdownOpen(false);
        setMobileMenuOpen(false);
        setLearnDropdownOpen(false);
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

          {/* Role Pill — mobile always-visible indicator (taps to open hamburger menu) */}
          {isAuthenticated && effectiveRole && (
            <button
              type="button"
              className="md:hidden flex items-center gap-1.5 px-2 py-1 rounded-full border border-border text-xs font-medium text-foreground bg-accent/50 hover:bg-accent transition flex-shrink-0"
              onClick={() => setMobileMenuOpen(true)}
              aria-label={`Current role: ${effectiveRole}. Tap to switch.`}
            >
              {effectiveRole === 'provider' && <Stethoscope className="w-3.5 h-3.5" />}
              {effectiveRole === 'institution' && <Briefcase className="w-3.5 h-3.5" />}
              <span className="capitalize">{effectiveRole ? roleDisplayLabel[effectiveRole] : ""}</span>
            </button>
          )}

          {/* Role Selector - Persistent and Prominent (desktop) */}
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
                {effectiveRole === "institution" && <Briefcase className="w-4 h-4" />}
                <span className="capitalize">{effectiveRole ? roleDisplayLabel[effectiveRole] : ""}</span>
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
                            const r = option.value as "provider" | "institution";
                            const prev = effectiveRole;
                            setUserRole(r);
                            setRoleDropdownOpen(false);
                            if (r === "provider" && prev === "institution") {
                              window.location.assign("/home");
                              return;
                            }
                            if (r === "provider") setLocation("/home");
                            else setLocation("/hospital-admin-dashboard");
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
            {primaryNavItems.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  className="px-3 py-2 text-foreground/90 hover:text-primary hover:bg-accent transition cursor-pointer text-sm font-medium rounded-lg"
                  onMouseEnter={link.href === "/aha-courses" ? prefetchAhaHub : undefined}
                  onFocus={link.href === "/aha-courses" ? prefetchAhaHub : undefined}
                >
                  {link.label}
                </span>
              </Link>
            ))}
            {learnNavItems.length > 0 && (
              <div className="relative" ref={learnDropdownRef}>
                <button
                  type="button"
                  onClick={() => setLearnDropdownOpen(!learnDropdownOpen)}
                  aria-haspopup="true"
                  aria-expanded={learnDropdownOpen}
                  className="flex items-center gap-1 px-3 py-2 text-foreground/90 hover:text-primary hover:bg-accent transition cursor-pointer text-sm font-medium rounded-lg"
                >
                  Learn
                  <ChevronDown className={`w-4 h-4 transition ${learnDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {learnDropdownOpen && (
                  <div
                    className="absolute left-0 mt-2 w-56 bg-popover text-popover-foreground rounded-lg shadow-lg border border-border z-10 p-1"
                    role="menu"
                    aria-label="Learn"
                  >
                    {learnNavItems.map((link) => (
                      <Link key={link.href} href={link.href}>
                        <span
                          className="block px-3 py-2 text-sm text-foreground hover:bg-accent transition cursor-pointer rounded"
                          onClick={() => setLearnDropdownOpen(false)}
                          onMouseEnter={link.href === "/aha-courses" ? prefetchAhaHub : undefined}
                          onFocus={link.href === "/aha-courses" ? prefetchAhaHub : undefined}
                        >
                          {link.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Anonymous quick paths — compound-first, not ResusGPS-only */}
          {!isAuthenticated && (
            <nav
              className="hidden md:flex items-center gap-1 text-sm text-muted-foreground mr-2"
              aria-label="Explore by audience"
            >
              <Link href="/training">
                <span className="px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer font-medium text-foreground">
                  Training
                </span>
              </Link>
              <Link href="/for-providers">
                <span className="px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer font-medium text-foreground">
                  Providers
                </span>
              </Link>
              <Link href="/for-parents">
                <span className="px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer">Parents</span>
              </Link>
              <Link href="/for-institutions">
                <span className="px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer">Institutions</span>
              </Link>
              <Link href="/help">
                <span className="px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer">Help</span>
              </Link>
            </nav>
          )}

          {/* Right Section: Search + Notifications + Account */}
          <div className="flex items-center gap-2 ml-auto">
            <GlobalSearch />
            {/* Notifications */}
            {isAuthenticated && (
              <NotificationBell />
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
                        <Link href="/feedback">
                          <div
                            className="px-3 py-2 text-sm text-foreground hover:bg-accent transition cursor-pointer rounded"
                            onClick={() => setAccountDropdownOpen(false)}
                          >
                            Send feedback
                          </div>
                        </Link>
                        <Link href="/account">
                          <div
                            className="px-3 py-2 text-sm text-foreground hover:bg-accent transition cursor-pointer rounded"
                            onClick={() => setAccountDropdownOpen(false)}
                          >
                            Account settings
                          </div>
                        </Link>
                        <Link href={effectiveRole === "institution" ? "/hospital-admin-dashboard" : "/home"}>
                          <div
                            className="px-3 py-2 text-sm text-foreground hover:bg-accent transition cursor-pointer rounded"
                            onClick={() => setAccountDropdownOpen(false)}
                          >
                            Dashboard
                          </div>
                        </Link>
                        {effectiveRole === "provider" && (
                          <Link href="/resus">
                            <div
                              className="px-3 py-2 text-sm text-foreground hover:bg-accent transition cursor-pointer rounded"
                              onClick={() => setAccountDropdownOpen(false)}
                            >
                              ResusGPS
                            </div>
                          </Link>
                        )}
                        <Link href={effectiveRole === "institution" ? "/hospital-admin-dashboard" : "/provider-profile"}>
                          <div
                            className="px-3 py-2 text-sm text-foreground hover:bg-accent transition cursor-pointer rounded"
                            onClick={() => setAccountDropdownOpen(false)}
                          >
                            {effectiveRole === "provider" ? "Profile" : "My dashboard"}
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

                      {/* Public pages — reachable regardless of account/role (e.g. filing a
                          Safe-Truth report needs no account and shouldn't require signing out) */}
                      <div className="py-2 space-y-1 border-t border-border">
                        <p className="px-3 pt-1 pb-1 text-xs font-semibold text-muted-foreground">Explore</p>
                        <Link href="/safe-truth">
                          <div
                            className="px-3 py-2 text-sm text-foreground hover:bg-accent transition cursor-pointer rounded"
                            onClick={() => setAccountDropdownOpen(false)}
                          >
                            Safe-Truth (share a story)
                          </div>
                        </Link>
                        <Link href="/help">
                          <div
                            className="px-3 py-2 text-sm text-foreground hover:bg-accent transition cursor-pointer rounded"
                            onClick={() => setAccountDropdownOpen(false)}
                          >
                            Help centre
                          </div>
                        </Link>
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
                <Link href="/register" className="hidden sm:block">
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
                <Link href="/training" onClick={() => setMobileMenuOpen(false)}>
                  <span className="block py-2 text-sm text-foreground font-medium">Training</span>
                </Link>
                <Link href="/for-providers" onClick={() => setMobileMenuOpen(false)}>
                  <span className="block py-2 text-sm text-foreground font-medium">Providers</span>
                </Link>
                <Link href="/for-parents" onClick={() => setMobileMenuOpen(false)}>
                  <span className="block py-2 text-sm text-foreground/90">Parents</span>
                </Link>
                <Link href="/for-institutions" onClick={() => setMobileMenuOpen(false)}>
                  <span className="block py-2 text-sm text-foreground/90">Institutions</span>
                </Link>
                <Link href="/help" onClick={() => setMobileMenuOpen(false)}>
                  <span className="block py-2 text-sm text-foreground/90">Help</span>
                </Link>
              </div>
            )}
            {isAuthenticated && (
              <div className="px-3 py-2 mb-2 space-y-1 border-b border-border pb-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Explore</p>
                <Link href="/safe-truth" onClick={() => setMobileMenuOpen(false)}>
                  <span className="block py-2 text-sm text-foreground font-medium">Safe-Truth (share a story)</span>
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
                        const r = option.value as "provider" | "institution";
                        const prev = effectiveRole;
                        setUserRole(r);
                        setMobileMenuOpen(false);
                        if (r === "provider" && prev === "institution") {
                          window.location.assign("/home");
                          return;
                        }
                        if (r === "provider") setLocation("/home");
                        else setLocation("/hospital-admin-dashboard");
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
                  onTouchStart={link.href === "/aha-courses" ? prefetchAhaHub : undefined}
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
