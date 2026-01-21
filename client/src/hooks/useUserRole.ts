import { useEffect, useState } from "react";

export type UserRole = "parent" | "provider" | "institution" | null;

/**
 * Hook to get and manage user role from localStorage
 * Provides reactive updates when role changes
 */
export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get role from localStorage
    const storedRole = localStorage.getItem("userRole") as UserRole;
    setRole(storedRole);
    setIsLoading(false);

    // Listen for storage changes (e.g., from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "userRole") {
        setRole(e.newValue as UserRole);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const setUserRole = (newRole: UserRole) => {
    if (newRole) {
      localStorage.setItem("userRole", newRole);
    } else {
      localStorage.removeItem("userRole");
    }
    setRole(newRole);
  };

  return {
    role,
    isLoading,
    setUserRole,
    isParent: role === "parent",
    isProvider: role === "provider",
    isInstitution: role === "institution",
  };
}
