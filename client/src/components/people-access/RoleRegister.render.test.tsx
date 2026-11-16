/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { queryMocks } = vi.hoisted(() => ({
  queryMocks: {
    departments: vi.fn(),
    admins: vi.fn(),
    productRoles: vi.fn(),
    heads: vi.fn(),
    ercos: vi.fn(),
    cpd: vi.fn(),
    staff: vi.fn(),
  },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    institution: {
      getFacilityDepartments: { useQuery: queryMocks.departments },
      getDepartmentResponseCoordinators: { useQuery: queryMocks.ercos },
      getStaffMembers: { useQuery: queryMocks.staff },
    },
    institutionAdmins: { list: { useQuery: queryMocks.admins } },
    institutionProducts: { listProductRoles: { useQuery: queryMocks.productRoles } },
    institutionAccountability: { listDepartmentHeadAppointments: { useQuery: queryMocks.heads } },
    institutionLearning: { listEducationCoordinators: { useQuery: queryMocks.cpd } },
  },
}));

vi.mock("../RoleAssignDrawer", () => ({ RoleAssignDrawer: () => null }));

import { RoleRegister } from "./RoleRegister";

function resolvedQueries() {
  queryMocks.departments.mockReturnValue({
    data: [{ id: 20, departmentName: "Emergency Department", isActive: true }],
    isError: false,
  });
  queryMocks.admins.mockReturnValue({ data: { admins: [], pendingInvites: [] }, isError: false });
  queryMocks.productRoles.mockReturnValue({ data: [], isError: false });
  queryMocks.heads.mockReturnValue({ data: [], isError: false });
  queryMocks.ercos.mockReturnValue({ data: [], isError: false });
  queryMocks.cpd.mockReturnValue({ data: [], isError: false });
  queryMocks.staff.mockReturnValue({ data: [], isError: false });
}

describe("RoleRegister query state", () => {
  it("renders the institution's canonical department when queries resolve", () => {
    resolvedQueries();

    render(<RoleRegister institutionId={5} />);

    expect(screen.getByText("Emergency Department")).toBeTruthy();
    expect(screen.queryByText("No departments or roles match this filter.")).toBeNull();
  });

  it("does not issue tenant queries for an invalid transient institution id", () => {
    resolvedQueries();

    render(<RoleRegister institutionId={0} />);

    for (const query of Object.values(queryMocks)) {
      expect(query).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ enabled: false, retry: 1 }),
      );
    }
  });
});
