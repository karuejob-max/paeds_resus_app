import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, LogOut, Bell, Settings } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { role } = useUserRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

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

  // Essential navigation based on role
  const getEssentialNav = () => {
    if (role === "provider") {
      return [
        { label: "Patients", href: "/patients" },
        { label: "Protocols", href: "/protocols" },
        { label: "Performance", href: "/performance-dashboard" },
      ];
    }
    if (role === "institution") {
      return [
        { label: "Dashboard", href: "/hospital-admin-dashboard" },
        { label: "Staff", href: "/institutional-portal" },
      ];
    }
    if (role === "parent") {
      return [
        { label: "Resources", href: "/parent-safe-truth" },
        { label: "Learning", href: "/learner-dashboard" },
      ];
    }
    // Default for unauthenticated users
    return [
      { label: "For Providers", href: "/institutional" },
      { label: "For Parents", href: "/parent-safe-truth" },
    ];
  };

  const essentialNav = getEssentialNav();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b-2 border-[#1a4d4d]">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition">
              <img src="/paeds-resus-logo.png" alt="Paeds Resus" className="w-10 h-10" />
              <span className="font-bold text-base text-[#1a4d4d] hidden sm:inline">Paeds Resus</span>
            </div>
          </Link>

          {/* Desktop Navigation - Essential Items Only */}
          <nav className="hidden lg:flex items-center gap-6">
            {essentialNav.map((link) => (
              <Link key={link.href} href={link.href}>
                <span className="text-gray-700 hover:text-[#1a4d4d] transition cursor-pointer text-sm font-medium">
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* Right Section: Notifications + Account */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            {isAuthenticated && (
              <button className="p-2 hover:bg-orange-50 rounded-lg transition">
                <Bell className="w-5 h-5 text-gray-700" />
              </button>
            )}

            {/* Auth Section */}
            {isAuthenticated ? (
              <div className="relative" ref={accountDropdownRef}>
                <button
                  onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-orange-50 rounded-lg transition text-sm font-medium"
                >
                  <div className="w-8 h-8 rounded-full bg-[#1a4d4d] text-white flex items-center justify-center text-xs font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className={`w-4 h-4 transition ${accountDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {accountDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <div className="p-3">
                      {/* User Info */}
                      <div className="px-3 py-2 border-b">
                        <p className="font-semibold text-sm text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>

                      {/* Quick Links */}
                      <div className="py-2 space-y-1">
                        <Link href="/learner-dashboard">
                          <div
                            className="px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#1a4d4d] transition cursor-pointer rounded"
                            onClick={() => setAccountDropdownOpen(false)}
                          >
                            Dashboard
                          </div>
                        </Link>
                        <Link href="/provider-profile">
                          <div
                            className="px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#1a4d4d] transition cursor-pointer rounded"
                            onClick={() => setAccountDropdownOpen(false)}
                          >
                            Profile
                          </div>
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="border-t pt-2">
                        <button
                          onClick={() => {
                            logout();
                            setAccountDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition cursor-pointer rounded flex items-center gap-2"
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
                  <Button variant="outline" size="sm" className="border-[#1a4d4d] text-[#1a4d4d] hover:bg-orange-50 text-xs">
                    Sign In
                  </Button>
                </a>
                <a href={getLoginUrl()} className="hidden sm:block">
                  <Button className="bg-[#ff6633] hover:bg-[#e55a22]" size="sm">
                    Get Started
                  </Button>
                </a>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden mt-4 space-y-2 pb-4">
            {essentialNav.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  className="block px-3 py-2 text-gray-700 hover:bg-orange-50 hover:text-[#1a4d4d] rounded transition cursor-pointer font-medium text-sm"
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
