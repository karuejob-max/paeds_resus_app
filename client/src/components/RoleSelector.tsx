import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ChevronDown } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

type UserRoleType = "parent" | "provider" | "institution";

interface RoleSelectorProps {
  onRoleChange?: (role: UserRoleType) => void;
}

export default function RoleSelector({ onRoleChange }: RoleSelectorProps) {
  const { role, setUserRole } = useUserRole();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  const roleOptions: { value: UserRoleType; label: string; color: string; description: string }[] = [
    {
      value: "parent",
      label: "Parent / Caregiver",
      color: "bg-green-50 border-green-200 hover:bg-green-100",
      description: "Access parent resources and courses",
    },
    {
      value: "provider",
      label: "Healthcare Provider",
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
      description: "Access clinical protocols and Safe-Truth",
    },
    {
      value: "institution",
      label: "Institution / Hospital",
      color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
      description: "Manage institutional accounts and analytics",
    },
  ];

  const currentRoleOption = roleOptions.find((r) => r.value === role);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleRoleChange = (newRole: UserRoleType) => {
    if (newRole && newRole !== role) {
      setUserRole(newRole);
      setIsOpen(false);

      // Call callback if provided
      if (onRoleChange) {
        onRoleChange(newRole);
      }

      // Redirect to home if on a role-specific page
      const roleSpecificPages = [
        "/elite-fellowship",
        "/safe-truth",
        "/safetruth-tool",
        "/institutional-analytics",
        "/institutional-management",
        "/institutional-dashboard",
      ];

      const currentPath = window.location.pathname;
      if (roleSpecificPages.some((page) => currentPath.includes(page))) {
        navigate("/");
      }
    }
  };

  const getRoleColor = (roleVal: UserRoleType | null) => {
    switch (roleVal) {
      case "parent":
        return "text-green-700 bg-green-100";
      case "provider":
        return "text-blue-700 bg-blue-100";
      case "institution":
        return "text-purple-700 bg-purple-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-[#1a4d4d] hover:bg-orange-50 rounded transition"
      >
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(role)}`}>
          {currentRoleOption?.label || "Select Role"}
        </span>
        <ChevronDown className={`w-4 h-4 transition ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-3">
            {/* Header */}
            <div className="px-3 py-2 border-b">
              <p className="text-xs font-semibold text-gray-500 uppercase">Select Your Role</p>
            </div>

            {/* Role Options */}
            <div className="space-y-2 py-2">
              {roleOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleRoleChange(option.value)}
                  className={`w-full text-left px-3 py-3 rounded-lg border-2 transition ${
                    role === option.value
                      ? `border-[#1a4d4d] bg-[#f0f9f9]`
                      : `border-gray-200 ${option.color}`
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{option.label}</p>
                      <p className="text-xs text-gray-600">{option.description}</p>
                    </div>
                    {role === option.value && (
                      <div className="w-5 h-5 rounded-full bg-[#1a4d4d] flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Info Box */}
            <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 mt-2">
              💡 <strong>Tip:</strong> You can change your role anytime using this dropdown. Your content will update automatically.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
