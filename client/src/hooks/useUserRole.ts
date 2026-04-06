import { useEffect, useState } from "react";

export type UserRole = "parent" | "provider" | "institution" | null;

const VALID = new Set<string>(["parent", "provider", "institution"]);

function readStoredRole(): UserRole {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem("userRole");
  if (!v || !VALID.has(v)) return null;
  return v as UserRole;
}

/**
 * Hook to get and manage user role from localStorage
 * Provides reactive updates when role changes
 *
 * Initial state is read synchronously so the first paint (e.g. Home redirect) sees the role
 * chosen in the Header. A delayed read in useEffect alone left role null on first render and
 * sent institutional users back to the hospital dashboard after switching to Healthcare Provider.
 */
export function useUserRole() {
  const [role, setRole] = useState<UserRole>(readStoredRole);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setRole(readStoredRole());

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "userRole") {
        setRole((e.newValue && VALID.has(e.newValue) ? e.newValue : null) as UserRole);
      }
    };

    const handleRoleChange = (e: CustomEvent) => {
      const d = e.detail;
      setRole(d && VALID.has(d) ? (d as UserRole) : null);
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
