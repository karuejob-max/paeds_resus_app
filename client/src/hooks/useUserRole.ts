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

    // Also listen for custom events from setUserRole
    const handleRoleChange = (e: CustomEvent) => {
      setRole(e.detail as UserRole);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("userRoleChanged", handleRoleChange as EventListener);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userRoleChanged", handleRoleChange as EventListener);
    };
  }, []);

  const setUserRole = (newRole: UserRole) => {
    if (newRole) {
      localStorage.setItem("userRole", newRole);
    } else {
      localStorage.removeItem("userRole");
    }
    setRole(newRole);
    
    // Dispatch custom event to notify other components
    const event = new CustomEvent("userRoleChanged", { detail: newRole });
    window.dispatchEvent(event);
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
