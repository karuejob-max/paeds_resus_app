import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { getLoginUrl } from "@/const";
import NotificationCenter from "./NotificationCenter";
import { mainNavItems, learningNavItems, institutionalNavItems, supportNavItems, authenticatedNavItems, adminNavItems } from "@/const/navigation";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">PR</span>
              </div>
              <span className="font-bold text-lg text-gray-900 hidden sm:inline">Paeds Resus</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Main Links */}
            {mainNavItems.map((link) => (
              <Link key={link.href} href={link.href}>
                <span className="px-3 py-2 text-gray-700 hover:text-blue-900 hover:bg-gray-100 rounded transition cursor-pointer text-sm">
                  {link.label}
                </span>
              </Link>
            ))}

            {/* Learning Dropdown */}
            <div className="relative group">
              <button className="px-3 py-2 text-gray-700 hover:text-blue-900 hover:bg-gray-100 rounded transition text-sm flex items-center gap-1">
                Learning <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute left-0 mt-0 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                {learningNavItems.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <div className="px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition cursor-pointer border-b last:border-b-0">
                      <div className="font-medium text-sm">{link.label}</div>
                      {link.description && <div className="text-xs text-gray-500">{link.description}</div>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Institutional Dropdown */}
            <div className="relative group">
              <button className="px-3 py-2 text-gray-700 hover:text-blue-900 hover:bg-gray-100 rounded transition text-sm flex items-center gap-1">
                Institutional <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute left-0 mt-0 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                {institutionalNavItems.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <div className="px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition cursor-pointer border-b last:border-b-0">
                      <div className="font-medium text-sm">{link.label}</div>
                      {link.description && <div className="text-xs text-gray-500">{link.description}</div>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Support Dropdown */}
            <div className="relative group">
              <button className="px-3 py-2 text-gray-700 hover:text-blue-900 hover:bg-gray-100 rounded transition text-sm flex items-center gap-1">
                Support <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute left-0 mt-0 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                {supportNavItems.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <div className="px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition cursor-pointer border-b last:border-b-0">
                      <div className="font-medium text-sm">{link.label}</div>
                      {link.description && <div className="text-xs text-gray-500">{link.description}</div>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* Notifications */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center">
              <NotificationCenter />
            </div>
          )}

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {user?.role === "admin" && (
                  <div className="flex gap-2 mr-2">
                    {adminNavItems.map((link) => (
                      <Link key={link.href} href={link.href}>
                        <Button variant="ghost" size="sm" className="text-xs">{link.label}</Button>
                      </Link>
                    ))}
                  </div>
                )}
                {authenticatedNavItems.slice(0, 2).map((link) => (
                  <Link key={link.href} href={link.href}>
                    <Button variant="outline" size="sm" className="text-xs">{link.label}</Button>
                  </Link>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  className="text-xs"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <a href={getLoginUrl()}>
                  <Button variant="outline" size="sm">Sign In</Button>
                </a>
                <a href={getLoginUrl()}>
                  <Button className="bg-blue-900 hover:bg-blue-800" size="sm">Get Started</Button>
                </a>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 space-y-2 pb-4 max-h-96 overflow-y-auto">
            {/* Main Links */}
            {mainNavItems.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  className="block px-3 py-2 text-gray-700 hover:bg-blue-50 rounded transition cursor-pointer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </span>
              </Link>
            ))}

            <div className="border-t pt-2 mt-2">
              <button
                className="w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 rounded transition flex items-center justify-between"
                onClick={() => setOpenDropdown(openDropdown === "learning" ? null : "learning")}
              >
                Learning <ChevronDown className={`w-4 h-4 transition ${openDropdown === "learning" ? "rotate-180" : ""}`} />
              </button>
              {openDropdown === "learning" && (
                <div className="pl-4 space-y-1">
                  {learningNavItems.map((link) => (
                    <Link key={link.href} href={link.href}>
                      <span
                        className="block px-3 py-2 text-sm text-gray-600 hover:bg-blue-50 rounded transition cursor-pointer"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-2">
              <button
                className="w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 rounded transition flex items-center justify-between"
                onClick={() => setOpenDropdown(openDropdown === "institutional" ? null : "institutional")}
              >
                Institutional <ChevronDown className={`w-4 h-4 transition ${openDropdown === "institutional" ? "rotate-180" : ""}`} />
              </button>
              {openDropdown === "institutional" && (
                <div className="pl-4 space-y-1">
                  {institutionalNavItems.map((link) => (
                    <Link key={link.href} href={link.href}>
                      <span
                        className="block px-3 py-2 text-sm text-gray-600 hover:bg-blue-50 rounded transition cursor-pointer"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-2">
              <button
                className="w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 rounded transition flex items-center justify-between"
                onClick={() => setOpenDropdown(openDropdown === "support" ? null : "support")}
              >
                Support <ChevronDown className={`w-4 h-4 transition ${openDropdown === "support" ? "rotate-180" : ""}`} />
              </button>
              {openDropdown === "support" && (
                <div className="pl-4 space-y-1">
                  {supportNavItems.map((link) => (
                    <Link key={link.href} href={link.href}>
                      <span
                        className="block px-3 py-2 text-sm text-gray-600 hover:bg-blue-50 rounded transition cursor-pointer"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {isAuthenticated && (
              <div className="border-t pt-2 mt-2 space-y-2">
                {authenticatedNavItems.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <Button variant="outline" className="w-full justify-start text-xs" onClick={() => setMobileMenuOpen(false)}>
                      {link.label}
                    </Button>
                  </Link>
                ))}
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                >
                  Logout
                </Button>
              </div>
            )}

            {!isAuthenticated && (
              <div className="border-t pt-2 mt-2 space-y-2">
                <a href={getLoginUrl()} className="block">
                  <Button variant="outline" className="w-full">Sign In</Button>
                </a>
                <a href={getLoginUrl()} className="block">
                  <Button className="w-full bg-blue-900 hover:bg-blue-800">Get Started</Button>
                </a>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
