import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, LayoutDashboard, LogOut, Brain, AlertCircle } from "lucide-react";
import { getLoginUrl } from "@/const";
import { filterNavItems } from "@/lib/navigationFilter";
import { isNavItemVisible } from "@/lib/contentVisibility";
import NotificationCenter from "./NotificationCenter";
import RoleSelector from "./RoleSelector";
import { mainNavItems, adminNavItems } from "@/const/navigation";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { role } = useUserRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  // Filter navigation items based on user role and content visibility
  const filteredNavItems = mainNavItems.filter((item) => isNavItemVisible(item.label, role));

  // Force re-render when role changes
  useEffect(() => {
    // This effect runs whenever role changes, triggering a re-render
  }, [role]);

  // Close account dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
      }
    };

    if (accountDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [accountDropdownOpen]);

  // Authenticated user menu items
  const accountMenuItems = [
    { label: "Dashboard", href: "/dashboard", icon: "📊" },
    { label: "My Progress", href: "/progress", icon: "📈" },
    { label: "My Achievements", href: "/achievements", icon: "🏆" },
    { label: "Leaderboard", href: "/leaderboard", icon: "🎯" },
    { label: "Referral Program", href: "/referral-program", icon: "🤝" },
    { label: "My Certificates", href: "/verify-certificate", icon: "📜" },
    { label: "Payment History", href: "/payments", icon: "💳" },
  ];

  // ML Dashboard items (shown for healthcare providers)
  const mlDashboardItems = [
    { label: "Predictive Alerts", href: "/predictive-intervention", icon: "🚨" },
    { label: "Learning Path", href: "/personalized-learning", icon: "🧠" },
    { label: "Kaizen Dashboard", href: "/kaizen-dashboard", icon: "📊" },
  ];

  const handleNavClick = () => {
    setMobileMenuOpen(false);
    setAccountDropdownOpen(false);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50 border-b-4 border-[#1a4d4d]">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition">
              <img src="/paeds-resus-logo.png" alt="Paeds Resus" className="w-12 h-12" />
              <span className="font-bold text-lg text-[#1a4d4d] hidden sm:inline">Paeds Resus</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Main Links */}
            {filteredNavItems.filter((item) => isNavItemVisible(item.label, role)).map((link) => (
              <Link key={link.href} href={link.href}>
                <span className="px-3 py-2 text-gray-700 hover:text-[#1a4d4d] hover:bg-orange-50 rounded transition cursor-pointer text-sm font-medium">
                  {link.label}
                </span>
              </Link>
            ))}

            {/* ML Dashboards for authenticated users */}
            {isAuthenticated && (
              <div className="flex gap-1 ml-4 pl-4 border-l border-gray-300">
                {mlDashboardItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <span className="px-3 py-2 text-gray-700 hover:text-[#1a4d4d] hover:bg-blue-50 rounded transition cursor-pointer text-sm font-medium flex items-center gap-1">
                      <span>{item.icon}</span>
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </nav>

          {/* Right Section: Role Selector + Notifications + Auth */}
          <div className="hidden md:flex items-center gap-3">
            {/* Role Selector */}
            {isAuthenticated && <RoleSelector />}

            {/* Notifications */}
            {isAuthenticated && <NotificationCenter />}

            {/* Auth Section */}
            {isAuthenticated ? (
              <>
                {/* Admin Links */}
                {user?.role === "admin" && (
                  <div className="flex gap-2 border-r pr-3">
                    {adminNavItems.map((link) => (
                      <Link key={link.href} href={link.href}>
                        <Button variant="ghost" size="sm" className="text-xs">
                          {link.label}
                        </Button>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Account Dropdown */}
                <div className="relative" ref={accountDropdownRef}>
                  <button
                    onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-[#1a4d4d] hover:bg-orange-50 rounded transition text-sm font-medium"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Account
                    <ChevronDown className={`w-4 h-4 transition ${accountDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {accountDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      <div className="p-2">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b">
                          <p className="font-semibold text-sm text-gray-900">{user?.name}</p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>

                        {/* Menu Items */}
                        {accountMenuItems.map((item) => (
                          <Link key={item.href} href={item.href}>
                            <div
                              className="px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#1a4d4d] transition cursor-pointer rounded"
                              onClick={() => setAccountDropdownOpen(false)}
                            >
                              <span className="mr-2">{item.icon}</span>
                              {item.label}
                            </div>
                          </Link>
                        ))}

                        {/* Logout */}
                        <div className="border-t pt-2 mt-2">
                          <button
                            onClick={() => {
                              logout();
                              setAccountDropdownOpen(false);
                            }}
                            className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition cursor-pointer rounded flex items-center gap-2"
                          >
                            <LogOut className="w-4 h-4" />
                            Logout
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <a href={getLoginUrl()}>
                  <Button variant="outline" size="sm" className="border-[#1a4d4d] text-[#1a4d4d] hover:bg-orange-50">
                    Sign In
                  </Button>
                </a>
                <a href={getLoginUrl()}>
                  <Button className="bg-[#ff6633] hover:bg-[#e55a22]" size="sm">
                    Get Started
                  </Button>
                </a>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 space-y-2 pb-4 max-h-96 overflow-y-auto">
            {/* Main Links */}
            {filteredNavItems.filter((item) => isNavItemVisible(item.label, role)).map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  className="block px-3 py-2 text-gray-700 hover:bg-orange-50 hover:text-[#1a4d4d] rounded transition cursor-pointer font-medium"
                  onClick={handleNavClick}
                >
                  {link.label}
                </span>
              </Link>
            ))}

            {/* ML Dashboards for mobile */}
            {isAuthenticated && (
              <div className="border-t pt-2 mt-2">
                <div className="px-3 py-2 text-xs font-semibold text-[#1a4d4d] uppercase">ML Dashboards</div>
                {mlDashboardItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <span
                      className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-[#1a4d4d] rounded transition cursor-pointer font-medium"
                      onClick={handleNavClick}
                    >
                      {item.icon} {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {/* Authenticated User Section */}
            {isAuthenticated && (
              <div className="border-t pt-2 mt-2 space-y-1">
                <div className="px-3 py-2 text-sm font-semibold text-[#1a4d4d]">{user?.name}</div>

                {/* Account Menu Items */}
                {accountMenuItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <span
                      className="block px-3 py-2 text-gray-700 hover:bg-orange-50 hover:text-[#1a4d4d] rounded transition cursor-pointer text-sm"
                      onClick={handleNavClick}
                    >
                      {item.icon} {item.label}
                    </span>
                  </Link>
                ))}

                {/* Logout */}
                <button
                  onClick={() => {
                    logout();
                    handleNavClick();
                  }}
                  className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded transition text-sm flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}

            {/* Not Authenticated */}
            {!isAuthenticated && (
              <div className="border-t pt-2 mt-2 space-y-2">
                <a href={getLoginUrl()} onClick={handleNavClick}>
                  <Button variant="outline" className="w-full border-[#1a4d4d] text-[#1a4d4d] hover:bg-orange-50">
                    Sign In
                  </Button>
                </a>
                <a href={getLoginUrl()} onClick={handleNavClick}>
                  <Button className="w-full bg-[#ff6633] hover:bg-[#e55a22]">
                    Get Started
                  </Button>
                </a>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
