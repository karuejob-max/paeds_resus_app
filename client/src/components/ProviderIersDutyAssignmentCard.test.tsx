import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ProviderIersDutyAssignmentCard from "./ProviderIersDutyAssignmentCard";

const { mockUseQuery, mockUseMutation, mockInvalidate } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockUseMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  mockInvalidate: vi.fn(),
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: 254 } }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      institution: {
        getMyDepartmentResponseAssignments: { invalidate: mockInvalidate },
        getMyProviderDutyAssignments: { invalidate: mockInvalidate },
      },
      iers: { getMyShiftReadiness: { invalidate: mockInvalidate } },
    }),
    institution: {
      getMyDepartmentResponseAssignments: { useQuery: mockUseQuery },
      getMyProviderDutyAssignments: { useQuery: mockUseQuery },
      respondToDepartmentResponseCoordinatorAssignment: { useMutation: mockUseMutation },
      respondToDepartmentResponseBackup: { useMutation: mockUseMutation },
      respondToWeeklyErtlRotation: { useMutation: mockUseMutation },
      respondToShiftUtlRoster: { useMutation: mockUseMutation },
    },
  },
}));

describe("ProviderIersDutyAssignmentCard", () => {
  it("renders exact UTL hours and dated UTL/ERTL duties from the provider-duty contract", () => {
    mockUseQuery
      .mockReturnValueOnce({ data: [], isLoading: false })
      .mockReturnValueOnce({
        data: {
          nextUtl: {
            id: 1,
            departmentId: 10,
            departmentName: "Emergency Department",
            poleName: "North Pole",
            shiftDate: "2026-08-24T00:00:00.000Z",
            shiftType: "night",
            shiftStartTime: "21:30:00",
            shiftEndTime: "05:30:00",
            shiftEndDayOffset: 1,
            isShiftErtl: false,
            assignmentStatus: "pending_acceptance",
          },
          nextErtl: {
            id: 2,
            departmentId: 10,
            departmentName: "Emergency Department",
            poleName: "North Pole",
            startDate: "2026-08-31T00:00:00.000Z",
            endDate: "2026-09-06T00:00:00.000Z",
            weekNumber: 36,
            year: 2026,
            assignmentStatus: "active",
          },
          utl: [
            {
              id: 1,
              departmentId: 10,
              departmentName: "Emergency Department",
              poleName: "North Pole",
              shiftDate: "2026-08-24T00:00:00.000Z",
              shiftType: "night",
              shiftStartTime: "21:30:00",
              shiftEndTime: "05:30:00",
              shiftEndDayOffset: 1,
              isShiftErtl: false,
              assignmentStatus: "pending_acceptance",
            },
          ],
          ertl: [
            {
              id: 2,
              departmentId: 10,
              departmentName: "Emergency Department",
              poleName: "North Pole",
              startDate: "2026-08-31T00:00:00.000Z",
              endDate: "2026-09-06T00:00:00.000Z",
              weekNumber: 36,
              year: 2026,
              assignmentStatus: "active",
            },
          ],
        },
        isLoading: false,
      });

    render(<ProviderIersDutyAssignmentCard />);

    expect(screen.getAllByText(/21:30–05:30 \(\+1 day\)/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/2026/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Exact hours pending/)).toBeNull();
    expect(screen.getByText(/View complete UTL and ERTL rota/)).toBeTruthy();
  });

  it("shows direct UTL staffing access for an accepted ERCo", () => {
    mockUseQuery.mockReset();
    mockUseQuery
      .mockReturnValueOnce({
        data: [{
          id: 7,
          institutionId: 3,
          departmentId: 10,
          departmentName: "Emergency Department",
          poleId: 4,
          poleName: "North Pole",
          coordinatorUserId: 254,
          backupUserId: null,
          assignmentStatus: "active",
          effectiveFrom: "2026-08-01T00:00:00.000Z",
          effectiveUntil: null,
          acceptedAt: "2026-08-01T00:00:00.000Z",
          declinedAt: null,
          declineReason: null,
          backupAcceptedAt: null,
          backupDeclinedAt: null,
          backupDeclineReason: null,
        }],
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: { nextUtl: null, nextErtl: null, utl: [], ertl: [] },
        isLoading: false,
      });

    render(<ProviderIersDutyAssignmentCard />);

    expect(screen.getByRole("button", { name: /Manage UTL staffing/i })).toBeTruthy();
  });
});
