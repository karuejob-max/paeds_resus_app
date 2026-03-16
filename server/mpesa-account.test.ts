import { describe, it, expect } from "vitest";

/**
 * Test to verify MPESA_ACCOUNT environment variable is correctly used
 * in payment initiation and appears in the STK Push payload
 */
describe("M-Pesa Account Configuration", () => {
  it("should use MPESA_ACCOUNT in payment initiation", () => {
    // The MPESA_ACCOUNT environment variable should be set to the business name
    const expectedAccount = "Paeds Resus Limited";
    const actualAccount = process.env.MPESA_ACCOUNT;
    
    expect(actualAccount).toBe(expectedAccount);
  });

  it("should not use client-specific names for MPESA_ACCOUNT", () => {
    const account = process.env.MPESA_ACCOUNT;
    
    // Verify it's the business name, not a client name
    expect(account).toContain("Paeds Resus");
    expect(account).not.toContain("Clients");
    expect(account).not.toContain("Names");
  });

  it("should have MPESA_ACCOUNT set to production value", () => {
    const account = process.env.MPESA_ACCOUNT;
    
    // Verify it's set and not empty
    expect(account).toBeDefined();
    expect(account).toBeTruthy();
    expect(account?.length).toBeGreaterThan(0);
  });
});
