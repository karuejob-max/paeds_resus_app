import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatCadreLabel,
  cpdCertificateFilename,
  generateCpdCertificatePdf,
  decodeSignaturePng,
} from "./certificate";
import { buildAttendeeCsv, getCanonicalAttendeeDepartment } from "../routers/cpd";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";
import type { User } from "../../drizzle/schema";

const { mockSelect, mockUpdate, mockInsert, mockAssertInstitutionAccess, mockDb } = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockUpdate = vi.fn();
  const mockInsert = vi.fn();
  const mockAssertInstitutionAccess = vi.fn();

  const mockDb = {
    select: mockSelect,
    update: mockUpdate,
    insert: mockInsert,
  };
  return { mockSelect, mockUpdate, mockInsert, mockAssertInstitutionAccess, mockDb };
});

vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}));

vi.mock("../lib/institution-access", () => ({
  assertInstitutionAccess: mockAssertInstitutionAccess,
}));

vi.mock("../lib/institution-entitlements", () => ({
  assertInstitutionProductCapability: vi.fn().mockResolvedValue(undefined),
}));

/**
 * DB-optional unit tests for the pure CPD helpers (no database required), so
 * they pass in the fast `test:unit` gate with DATABASE_URL unset.
 */

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (c: Buffer) => chunks.push(c));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

describe("formatCadreLabel", () => {
  it("returns the cadre as-is for known cadres", () => {
    expect(formatCadreLabel("BSN")).toBe("BSN");
    expect(formatCadreLabel("KRCHN")).toBe("KRCHN");
    expect(formatCadreLabel("KRN")).toBe("KRN");
  });

  it("expands Other to the free-text value when present", () => {
    expect(formatCadreLabel("Other", "Clinical Officer")).toBe("Clinical Officer");
  });

  it("falls back to 'Other' when no free-text value is given", () => {
    expect(formatCadreLabel("Other")).toBe("Other");
    expect(formatCadreLabel("Other", "   ")).toBe("Other");
  });

  it("formats subspecialties for MSN, HND, and Consultant Physician", () => {
    expect(formatCadreLabel("MSN", "Paediatric Critical Care")).toBe("MSN (Paediatric Critical Care)");
    expect(formatCadreLabel("HND", "Nurse Anaesthesia")).toBe("HND (Nurse Anaesthesia)");
    expect(formatCadreLabel("Consultant Physician", "Paediatrician")).toBe("Consultant Physician (Paediatrician)");
    expect(formatCadreLabel("Consultant Physician Student", "Paediatrician")).toBe("Consultant Physician Student (Paediatrician)");
    expect(formatCadreLabel("RCO HND", "Anaesthesia")).toBe("HND (Anaesthesia)");
  });
});

describe("cpdCertificateFilename", () => {
  it("produces a safe, slugged filename", () => {
    expect(cpdCertificateFilename("Jane Wanjiku Mwangi", "Sepsis Update")).toBe(
      "CPD-Certificate-Jane-Wanjiku-Mwangi-Sepsis-Update.pdf"
    );
  });

  it("strips unsafe characters and collapses whitespace", () => {
    const name = cpdCertificateFilename("Dr. O'Brien / Nurse", "A&B  Course!!");
    expect(name).toMatch(/^CPD-Certificate-[\w-]+\.pdf$/);
    expect(name).not.toContain("'");
    expect(name).not.toContain("/");
    expect(name).not.toContain("&");
    expect(name).not.toContain("!");
  });

  it("falls back gracefully when inputs are blank", () => {
    expect(cpdCertificateFilename("", "")).toBe("CPD-Certificate-attendee-attendee.pdf");
  });
});

describe("getCanonicalAttendeeDepartment", () => {
  const names = new Map<number, string>([[7, "Critical Care: ICU"]]);

  it("uses the canonical local department for a linked attendance row", () => {
    expect(getCanonicalAttendeeDepartment({ department: "Paeds ICU", facilityDepartmentId: 7 }, names)).toBe("Critical Care: ICU");
  });

  it("preserves the raw text when there is no usable canonical identity", () => {
    expect(getCanonicalAttendeeDepartment({ department: "Unrecognised unit", facilityDepartmentId: 99 }, names)).toBe("Unrecognised unit");
    expect(getCanonicalAttendeeDepartment({ department: "Paeds ICU", facilityDepartmentId: null }, names)).toBe("Paeds ICU");
  });
});

describe("buildAttendeeCsv", () => {
  const baseRow = {
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "+254712345678",
    cadre: "KRCHN",
    cadreOther: null,
    higherDiploma: null,
    department: "PICU",
    eventName: "Sepsis Update",
    eventDate: "12 June 2026",
    submittedAt: "2026-06-12T08:00:00.000Z",
  };

  it("includes a header row and one line per attendee", () => {
    const csv = buildAttendeeCsv([baseRow]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toContain("Full Name");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("Jane Doe");
    expect(lines[1]).toContain("PICU");
  });

  it("quotes fields containing commas, quotes, or newlines", () => {
    const csv = buildAttendeeCsv([
      { ...baseRow, fullName: 'Doe, Jane "JD"', department: "Ward 3\nUnit B" },
    ]);
    expect(csv).toContain('"Doe, Jane ""JD"""');
    expect(csv).toContain('"Ward 3\nUnit B"');
  });

  it("keeps the recorded label and exposes a reconciled canonical department", () => {
    const csv = buildAttendeeCsv([
      { ...baseRow, department: "Paeds ICU", canonicalDepartmentName: "Critical Care: ICU" },
    ]);
    expect(csv.split("\r\n")[0]).toContain("Canonical Department");
    expect(csv).toContain("Paeds ICU,Critical Care: ICU");
  });

  it("handles an empty list (header only)", () => {
    const csv = buildAttendeeCsv([]);
    expect(csv.split("\r\n")).toHaveLength(1);
  });
});

describe("generateCpdCertificatePdf", () => {
  it("produces a non-empty PDF buffer with a valid header", async () => {
    const stream = generateCpdCertificatePdf({
      fullName: "Jane Wanjiku Mwangi",
      cadre: "KRCHN",
      eventName: "Paediatric Sepsis Update",
      eventDate: "12 June 2026",
      coordinatorName: "Job Karue",
      institutionName: "Consolata Hospital Mathari",
    });
    const buf = await streamToBuffer(stream);
    expect(buf.length).toBeGreaterThan(1000);
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("works without a coordinator name (defaults gracefully)", async () => {
    const stream = generateCpdCertificatePdf({
      fullName: "Test Nurse",
      cadre: "Other",
      cadreOther: "Clinical Officer",
      eventName: "BLS Refresher",
      eventDate: "01 Jan 2026",
      coordinatorName: null,
      institutionName: "County Referral Hospital",
    });
    const buf = await streamToBuffer(stream);
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
  });

  // A real, pdfkit-decodable 120x48 PNG, base64-encoded as a data URL.
  const validSignaturePng =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAAwCAYAAADab77TAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAA/0lEQVR4nO2VwREDMRDC7k8b9LL9V5RUkQEueujvQZb9yPeBe+0GT/oAcAjmEhwFcwmOJ1p/+CXwBzsvAcEFQ2kUCnZeAoILhtIoFOy8BAQXDKVRKNh5CQguGEqjULDzEhBcMJRGoWDnJSC4YCiNQsHOS0BwwVAahYKdl4DggqE0CgU7LwDggqE0CgU7LwEBBcMpVEo2HkJCC4YSqNQsPMSEFwwlEahYOcl/FLwF5NKymGd5D34AAAAAElFTkSuQmCC";

  it("embeds a valid signature image without breaking generation", async () => {
    const stream = generateCpdCertificatePdf({
      fullName: "Signed Nurse",
      cadre: "KRN",
      eventName: "Signed Session",
      eventDate: "02 Feb 2026",
      coordinatorName: "Job Karue",
      coordinatorSignature: validSignaturePng,
      institutionName: "Consolata Hospital Mathari",
    });
    const buf = await streamToBuffer(stream);
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(buf.length).toBeGreaterThan(1000);
  });

  it("ignores a malformed signature and still produces a valid PDF", async () => {
    const stream = generateCpdCertificatePdf({
      fullName: "Test Nurse",
      cadre: "BSN",
      eventName: "Session",
      eventDate: "03 Mar 2026",
      coordinatorSignature: "not-a-valid-data-url",
      institutionName: "County Referral Hospital",
    });
    const buf = await streamToBuffer(stream);
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
  });
});

describe("decodeSignaturePng", () => {
  const validPngDataUrl =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  it("decodes a valid PNG data URL to a non-empty Buffer", () => {
    const buf = decodeSignaturePng(validPngDataUrl);
    expect(buf).toBeInstanceOf(Buffer);
    expect((buf as Buffer).length).toBeGreaterThan(0);
  });

  it("returns null for empty, missing, or non-PNG input", () => {
    expect(decodeSignaturePng(null)).toBeNull();
    expect(decodeSignaturePng(undefined)).toBeNull();
    expect(decodeSignaturePng("")).toBeNull();
    expect(decodeSignaturePng("data:image/jpeg;base64,/9j/4AAQ")).toBeNull();
    expect(decodeSignaturePng("not-a-data-url")).toBeNull();
  });
});

describe("CPD Router Procedures", () => {
  const mockUser: User = {
    id: 10,
    openId: "test-user-10",
    email: "nurse@test.com",
    name: "Test Nurse",
    loginMethod: "manus",
    role: "user",
    userType: "individual",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    phone: null,
    institutionalRole: null,
    providerType: null,
    instructorApprovedAt: null,
    instructorNumber: null,
    instructorCertifiedAt: null,
    resusGpsAccessExpiresAt: null,
    cadre: null,
    cadreOther: null,
  };

  const mockContext: TrpcContext = {
    user: mockUser,
    req: {
      ip: "127.0.0.1",
      headers: { "user-agent": "test-agent" },
    } as any,
    res: {} as any,
  };

  const mockAdminContext: TrpcContext = {
    user: { ...mockUser, role: "admin" },
    req: {} as any,
    res: {} as any,
  };

  beforeEach(() => {
    mockSelect.mockReset();
    mockUpdate.mockReset();
    mockInsert.mockReset();
    mockAssertInstitutionAccess.mockReset();
    mockAssertInstitutionAccess.mockResolvedValue(undefined);
    const fallbackLimit = vi.fn().mockResolvedValue([]);
    const fallbackOrderBy = vi.fn().mockReturnValue({ limit: fallbackLimit });
    const fallbackWhere = vi.fn().mockReturnValue({ limit: fallbackLimit, orderBy: fallbackOrderBy });
    const fallbackFrom = vi.fn().mockReturnValue({ where: fallbackWhere });
    mockSelect.mockImplementation(() => ({ from: fallbackFrom }));
    const mockUpdateWhere = vi.fn().mockResolvedValue({});
    const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
    mockUpdate.mockReturnValue({ set: mockUpdateSet });
  });

  it("updates CPD code for an event when authorized", async () => {
    // Mock cpdEvents query
    const mockLimit = vi.fn().mockResolvedValue([{ id: 100 }]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });

    // Mock event audit insert introduced by the safe code-rotation contract.
    const mockAuditValues = vi.fn().mockResolvedValue({ success: true });
    mockInsert.mockReturnValue({ values: mockAuditValues });

    // Mock update query
    const mockUpdateWhere = vi.fn().mockResolvedValue({ success: true });
    const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
    mockUpdate.mockReturnValue({ set: mockSet });

    const caller = appRouter.createCaller(mockAdminContext);
    const res = await caller.cpd.updateCpdCode({
      institutionId: 1,
      eventId: 100,
      cpdCode: "TEST-CPD-123",
    });

    expect(res.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith({ cpdCode: "TEST-CPD-123" });
    expect(mockAuditValues).toHaveBeenCalled();
  });

  it("logs CPD code reveal when user views the code", async () => {
    // Mock cpdAttendees query
    const mockLimit = vi.fn().mockResolvedValue([{ id: 500 }]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });

    // Mock insert query
    const mockValues = vi.fn().mockResolvedValue({ success: true });
    mockInsert.mockReturnValue({ values: mockValues });

    const caller = appRouter.createCaller(mockContext);
    const res = await caller.cpd.logCpdCodeReveal({
      attendeeId: 500,
      eventId: 100,
    });

    expect(res.success).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 10,
        cpdAttendeeId: 500,
        cpdEventId: 100,
        ipAddress: "127.0.0.1",
        userAgent: "test-agent",
      })
    );
  });

  it("myCertificates query returns cpdCode field", async () => {
    // Mock select / join / where chain for myCertificates
    const mockOrderBy = vi.fn().mockResolvedValue([
      {
        attendeeId: 500,
        eventId: 100,
        fullName: "Test Nurse",
        cadre: "KRCHN",
        cadreOther: null,
        department: "Emergency",
        submittedAt: new Date(),
        eventName: "Sepsis Update",
        eventDate: "12 June 2026",
        institutionName: "Consolata Hospital Mathari",
        cpdCode: "TEST-CPD-123",
      },
    ]);
    const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
    const mockJoin2 = vi.fn().mockReturnValue({ where: mockWhere });
    const mockJoin1 = vi.fn().mockReturnValue({ leftJoin: mockJoin2 });
    const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockJoin1 });
    mockSelect.mockReturnValueOnce({ from: mockFrom });

    const mockStaffLinksWhere = vi.fn().mockResolvedValue([]);
    const mockStaffLinksFrom = vi.fn().mockReturnValue({ where: mockStaffLinksWhere });
    mockSelect.mockReturnValueOnce({ from: mockStaffLinksFrom });

    const mockAttendeeLimit = vi.fn().mockResolvedValue([{ instId: 100 }]);
    const mockAttendeeWhere = vi.fn().mockReturnValue({ limit: mockAttendeeLimit });
    const mockAttendeeFrom = vi.fn().mockReturnValue({ where: mockAttendeeWhere });
    mockSelect.mockReturnValueOnce({ from: mockAttendeeFrom });

    const mockInstEventsWhere = vi.fn().mockResolvedValue([]);
    const mockInstEventsFrom = vi.fn().mockReturnValue({ where: mockInstEventsWhere });
    mockSelect.mockReturnValueOnce({ from: mockInstEventsFrom });

    const caller = appRouter.createCaller(mockContext);
    const res = await caller.cpd.myCertificates();

    expect(res.email).toBe("nurse@test.com");
    expect(res.records).toHaveLength(1);
    expect(res.records[0].cpdCode).toBe("TEST-CPD-123");
  });

  it("allows submitting registration when authenticated and email matches session", async () => {
    const mockLimit1 = vi.fn().mockResolvedValue([{ id: 100 }]);
    const mockOrderBy1 = vi.fn().mockReturnValue({ limit: mockLimit1 });
    const mockWhere1 = vi.fn().mockReturnValue({ orderBy: mockOrderBy1 });
    const mockFrom1 = vi.fn().mockReturnValue({ where: mockWhere1 });
    mockSelect.mockReturnValueOnce({ from: mockFrom1 });

    const mockDepartmentsWhere = vi.fn().mockResolvedValue([]);
    const mockDepartmentsFrom = vi.fn().mockReturnValue({ where: mockDepartmentsWhere });
    mockSelect.mockReturnValueOnce({ from: mockDepartmentsFrom });

    const mockAttendanceLimit = vi.fn().mockResolvedValue([]);
    const mockAttendanceWhere = vi.fn().mockReturnValue({ limit: mockAttendanceLimit });
    const mockAttendanceFrom = vi.fn().mockReturnValue({ where: mockAttendanceWhere });
    mockSelect.mockReturnValueOnce({ from: mockAttendanceFrom });

    const mockProfileLimit = vi.fn().mockResolvedValue([]);
    const mockProfileWhere = vi.fn().mockReturnValue({ limit: mockProfileLimit });
    const mockProfileFrom = vi.fn().mockReturnValue({ where: mockProfileWhere });
    mockSelect.mockReturnValueOnce({ from: mockProfileFrom });

    const mockValues = vi.fn().mockResolvedValue({ success: true });
    mockInsert.mockReturnValue({ values: mockValues });

    const caller = appRouter.createCaller(mockContext);
    const res = await caller.cpd.submitRegistration({
      institutionId: 1,
      fullName: "Test Nurse",
      email: "nurse@test.com",
      phone: "+254712345678",
      cadre: "KRCHN",
      department: "Pediatrics",
      facilityRelationship: "locum_outreach",
    });

    expect(res.success).toBe(true);
    expect(res.facilityRelationship).toBe("locum_outreach");
    expect(res.facilityLinkStatus).toBe("linked");
    expect(mockInsert).toHaveBeenCalled();
  });

  it("allows self-registration for an ordinary signed-in attendee without a CPD responsibility role", async () => {
    const mockLimit1 = vi.fn().mockResolvedValue([{ id: 100 }]);
    const mockOrderBy1 = vi.fn().mockReturnValue({ limit: mockLimit1 });
    const mockWhere1 = vi.fn().mockReturnValue({ orderBy: mockOrderBy1 });
    const mockFrom1 = vi.fn().mockReturnValue({ where: mockWhere1 });
    mockSelect.mockReturnValueOnce({ from: mockFrom1 });

    const mockDepartmentsWhere = vi.fn().mockResolvedValue([]);
    const mockDepartmentsFrom = vi.fn().mockReturnValue({ where: mockDepartmentsWhere });
    mockSelect.mockReturnValueOnce({ from: mockDepartmentsFrom });

    const mockAttendanceLimit = vi.fn().mockResolvedValue([]);
    const mockAttendanceWhere = vi.fn().mockReturnValue({ limit: mockAttendanceLimit });
    const mockAttendanceFrom = vi.fn().mockReturnValue({ where: mockAttendanceWhere });
    mockSelect.mockReturnValueOnce({ from: mockAttendanceFrom });

    const mockProfileLimit = vi.fn().mockResolvedValue([]);
    const mockProfileWhere = vi.fn().mockReturnValue({ limit: mockProfileLimit });
    const mockProfileFrom = vi.fn().mockReturnValue({ where: mockProfileWhere });
    mockSelect.mockReturnValueOnce({ from: mockProfileFrom });

    const mockValues = vi.fn().mockResolvedValue({ success: true });
    mockInsert.mockReturnValue({ values: mockValues });

    const caller = appRouter.createCaller(mockContext);
    const res = await caller.cpd.submitRegistration({
      institutionId: 1,
      fullName: "Test Nurse",
      email: "nurse@test.com",
      phone: "+254712345678",
      cadre: "KRCHN",
      department: "Pediatrics",
      facilityRelationship: "permanent_facility",
    });

    expect(res.success).toBe(true);
    expect(res.facilityRelationship).toBe("permanent_facility");
    expect(res.facilityLinkStatus).toBe("linked");
    expect(mockAssertInstitutionAccess).not.toHaveBeenCalled();
  });

  it("rejects a department that is not in the institution's canonical IERS list", async () => {
    const mockLimit1 = vi.fn().mockResolvedValue([{ id: 100 }]);
    const mockOrderBy1 = vi.fn().mockReturnValue({ limit: mockLimit1 });
    const mockWhere1 = vi.fn().mockReturnValue({ orderBy: mockOrderBy1 });
    const mockFrom1 = vi.fn().mockReturnValue({ where: mockWhere1 });
    mockSelect.mockReturnValueOnce({ from: mockFrom1 });

    const mockDepartmentsWhere = vi.fn().mockResolvedValue([{ id: 21, departmentName: "PICU" }]);
    const mockDepartmentsFrom = vi.fn().mockReturnValue({ where: mockDepartmentsWhere });
    mockSelect.mockReturnValueOnce({ from: mockDepartmentsFrom });

    const caller = appRouter.createCaller(mockContext);
    await expect(caller.cpd.submitRegistration({
      institutionId: 1,
      fullName: "Test Nurse",
      email: "nurse@test.com",
      phone: "+254712345678",
      cadre: "KRCHN",
      department: "Emergency",
    })).rejects.toThrow(/Choose a department from this institution's IERS department list/);
  });

  it("persists the selected canonical IERS department identity", async () => {
    const mockLimit1 = vi.fn().mockResolvedValue([{ id: 100 }]);
    const mockOrderBy1 = vi.fn().mockReturnValue({ limit: mockLimit1 });
    const mockWhere1 = vi.fn().mockReturnValue({ orderBy: mockOrderBy1 });
    const mockFrom1 = vi.fn().mockReturnValue({ where: mockWhere1 });
    mockSelect.mockReturnValueOnce({ from: mockFrom1 });

    const mockDepartmentsWhere = vi.fn().mockResolvedValue([{ id: 21, departmentName: "PICU" }]);
    const mockDepartmentsFrom = vi.fn().mockReturnValue({ where: mockDepartmentsWhere });
    mockSelect.mockReturnValueOnce({ from: mockDepartmentsFrom });

    const mockAttendanceLimit = vi.fn().mockResolvedValue([]);
    const mockAttendanceWhere = vi.fn().mockReturnValue({ limit: mockAttendanceLimit });
    const mockAttendanceFrom = vi.fn().mockReturnValue({ where: mockAttendanceWhere });
    mockSelect.mockReturnValueOnce({ from: mockAttendanceFrom });

    const mockProfileLimit = vi.fn().mockResolvedValue([]);
    const mockProfileWhere = vi.fn().mockReturnValue({ limit: mockProfileLimit });
    const mockProfileFrom = vi.fn().mockReturnValue({ where: mockProfileWhere });
    mockSelect.mockReturnValueOnce({ from: mockProfileFrom });

    const mockValues = vi.fn().mockResolvedValue({ success: true });
    mockInsert.mockReturnValue({ values: mockValues });

    const caller = appRouter.createCaller(mockContext);
    await caller.cpd.submitRegistration({
      institutionId: 1,
      fullName: "Test Nurse",
      email: "nurse@test.com",
      phone: "+254712345678",
      cadre: "KRCHN",
      department: "Legacy PICU label",
      facilityDepartmentId: 21,
    });

    expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
      department: "Critical Care: PICU",
      facilityDepartmentId: 21,
    }));
  });

  it("throws FORBIDDEN when submitting registration with email different from session", async () => {
    const caller = appRouter.createCaller(mockContext);
    await expect(
      caller.cpd.submitRegistration({
        institutionId: 1,
        fullName: "Proxy Nurse",
        email: "other@test.com",
        phone: "+254712345678",
        cadre: "KRCHN",
        department: "Pediatrics",
      })
    ).rejects.toThrow(/You can only register for yourself/);
  });
});
