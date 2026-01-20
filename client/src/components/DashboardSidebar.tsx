import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, LogOut } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { dashboardNavItems } from "@/const/navigation";
import { Button } from "@/components/ui/button";

export default function DashboardSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [location] = useLocation();
  const { logout } = useAuth();

  const isActive = (href: string) => location === href;

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-6 right-6 lg:hidden z-40 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white p-6 overflow-y-auto transition-transform duration-300 z-30 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <div className="flex items-center gap-3 cursor-pointer mb-2">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">PR</span>
              </div>
              <span className="font-bold text-lg">Paeds Resus</span>
            </div>
          </Link>
          <p className="text-xs text-gray-400">Learning Dashboard</p>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-2 mb-8">
          {dashboardNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition cursor-pointer ${
                  isActive(item.href)
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
                onClick={() => {
                  // Close sidebar on mobile after clicking
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>

        {/* Divider */}
        <div className="border-t border-gray-700 mb-6" />

        {/* Learning Resources Section */}
        <div className="mb-8">
          <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Resources</h4>
          <div className="space-y-2">
            <Link href="/elite-fellowship">
              <div className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded transition cursor-pointer">
                Elite Fellowship
              </div>
            </Link>
            <Link href="/safe-truth">
              <div className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded transition cursor-pointer">
                Safe-Truth Tool
              </div>
            </Link>
            <Link href="/success-stories">
              <div className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded transition cursor-pointer">
                Success Stories
              </div>
            </Link>
          </div>
        </div>

        {/* Support Section */}
        <div className="mb-8">
          <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Support</h4>
          <div className="space-y-2">
            <Link href="/faq">
              <div className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded transition cursor-pointer">
                FAQ
              </div>
            </Link>
            <Link href="/contact">
              <div className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded transition cursor-pointer">
                Contact Us
              </div>
            </Link>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          onClick={() => {
            logout();
            setSidebarOpen(false);
          }}
          variant="outline"
          className="w-full justify-start gap-2 text-gray-300 border-gray-700 hover:bg-gray-800"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
