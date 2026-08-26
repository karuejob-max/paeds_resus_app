import { useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useUserRole, type UserRole } from "@/hooks/useUserRole";

type WorkspaceOption = {
  value: Exclude<UserRole, null>;
  label: string;
  description: string;
};

function mapUserTypeToWorkspace(userType: string | null | undefined): UserRole {
  if (userType === "institutional") return "institution";
  if (userType === "individual") return "provider";
  return null;
}

/**
 * Workspace selection is a view preference. It is never the source of
 * authorization. Institution options are derived from administered
 * institutions or active memberships returned by the server.
 */
export function useWorkspaceAccess() {
  const { user, isAuthenticated } = useAuth();
  const { role, setUserRole } = useUserRole();
  const membershipsQuery = trpc.institution.getMyMemberships.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
      staleTime: 30_000,
    }
  );
  const administeredQuery = trpc.institution.getMyInstitution.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
      staleTime: 30_000,
    }
  );

  const isPlatformAdmin = (user as { role?: string } | null)?.role === "admin";
  const hasInstitutionAccess =
    isAuthenticated &&
    (isPlatformAdmin ||
      (administeredQuery.data?.institutions?.length ?? 0) > 0 ||
      (membershipsQuery.data?.some(
        membership => membership.membershipStatus === "active"
      ) ??
        false));

  const workspaceOptions = useMemo<WorkspaceOption[]>(() => {
    const options: WorkspaceOption[] = [
      {
        value: "provider",
        label: "Individual workspace",
        description: "Your bedside tools, learning, shift, and records",
      },
    ];
    if (hasInstitutionAccess) {
      options.push({
        value: "institution",
        label: "Institution workspace",
        description: "Institutional operations and administration",
      });
    }
    return options;
  }, [hasInstitutionAccess]);

  const serverDefaultWorkspace = mapUserTypeToWorkspace(user?.userType);
  const storedWorkspaceIsAvailable = workspaceOptions.some(
    option => option.value === role
  );
  const defaultWorkspaceIsAvailable = workspaceOptions.some(
    option => option.value === serverDefaultWorkspace
  );
  const effectiveWorkspace = storedWorkspaceIsAvailable
    ? role
    : defaultWorkspaceIsAvailable
      ? serverDefaultWorkspace
      : "provider";

  return {
    role,
    effectiveWorkspace,
    setUserRole,
    workspaceOptions,
    hasInstitutionAccess,
    isLoading: membershipsQuery.isLoading || administeredQuery.isLoading,
    isInstitutionAccessKnown:
      membershipsQuery.isSuccess ||
      administeredQuery.isSuccess ||
      membershipsQuery.isError ||
      administeredQuery.isError,
    memberships: membershipsQuery.data ?? [],
    administeredInstitutions: administeredQuery.data?.institutions ?? [],
  };
}

export type { WorkspaceOption };
