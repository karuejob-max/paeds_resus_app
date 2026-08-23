/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErtRosterPanel } from "./ErtRosterPanel";

const {
  polesQuery,
  departmentsQuery,
  staffMembersQuery,
  nurseCandidatesQuery,
  shiftTemplatesQuery,
  monthlyRotaQuery,
  ercoAssignmentsQuery,
  shiftRosterQuery,
  weeklyRotationQuery,
  useMutation,
  invalidate,
  refetch,
} = vi.hoisted(() => ({
  polesQuery: vi.fn(),
  departmentsQuery: vi.fn(() => ({ data: [] })),
  staffMembersQuery: vi.fn(() => ({ data: [] })),
  nurseCandidatesQuery: vi.fn(() => ({ data: [], refetch: vi.fn() })),
  shiftTemplatesQuery: vi.fn(() => ({ data: [] })),
  monthlyRotaQuery: vi.fn(() => ({ data: undefined })),
  ercoAssignmentsQuery: vi.fn(() => ({ data: [] })),
  shiftRosterQuery: vi.fn(() => ({ data: undefined, refetch: vi.fn() })),
  weeklyRotationQuery: vi.fn(() => ({ data: undefined })),
  useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  invalidate: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      institution: {
        getFacilityPoles: { invalidate },
        getPoleNurseCandidates: { invalidate },
        getInstitutionShiftTemplates: { invalidate },
        getMonthlyUtlRota: { invalidate },
        getShiftUtlRoster: { invalidate },
        getWeeklyErtlRotation: { invalidate },
        getDepartmentResponseCoordinators: { invalidate },
      },
    }),
    institution: {
      getFacilityPoles: { useQuery: polesQuery },
      getFacilityDepartments: { useQuery: departmentsQuery },
      getStaffMembers: { useQuery: staffMembersQuery },
      getPoleNurseCandidates: { useQuery: nurseCandidatesQuery },
      getInstitutionShiftTemplates: { useQuery: shiftTemplatesQuery },
      getMonthlyUtlRota: { useQuery: monthlyRotaQuery },
      getDepartmentResponseCoordinators: { useQuery: ercoAssignmentsQuery },
      getShiftUtlRoster: { useQuery: shiftRosterQuery },
      getWeeklyErtlRotation: { useQuery: weeklyRotationQuery },
      createFacilityPole: { useMutation },
      reorderFacilityPoles: { useMutation },
      setWeeklyErtlRotation: { useMutation },
      submitShiftUtlRoster: { useMutation },
      createInstitutionShiftTemplate: { useMutation },
      bulkAssignShiftUtlProvider: { useMutation },
      autopopulateMonthlyUtlRota: { useMutation },
      assignDepartmentResponseCoordinator: { useMutation },
      addDepartmentNurseCandidate: { useMutation },
    },
  },
}));

vi.mock("./ErtBillboardWidget", () => ({
  ErtBillboardWidget: () => null,
}));

describe("ErtRosterPanel hook order", () => {
  it("keeps the same hook order when roster loading completes", () => {
    let isLoading = true;
    polesQuery.mockImplementation(() => ({ data: isLoading ? undefined : [], isLoading }));

    const { rerender } = render(<ErtRosterPanel institutionId={1} />);
    expect(screen.getByText("Loading ERT Roster Matrix...")).toBeTruthy();

    isLoading = false;
    expect(() => rerender(<ErtRosterPanel institutionId={1} />)).not.toThrow();
    expect(screen.getByText("24/7 ERT Roster Matrix & Shift UTL Allocation")).toBeTruthy();
  });
});
