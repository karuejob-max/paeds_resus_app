import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getMpesaDeploymentMode, getMpesaEnvironmentSource } from "./mpesa-env";

const SAVED_MPESA_ENVIRONMENT = process.env.MPESA_ENVIRONMENT;
const SAVED_MPESA_ENV = process.env.MPESA_ENV;

describe("mpesa-env", () => {
  beforeEach(() => {
    delete process.env.MPESA_ENVIRONMENT;
    delete process.env.MPESA_ENV;
  });

  afterEach(() => {
    if (SAVED_MPESA_ENVIRONMENT === undefined) delete process.env.MPESA_ENVIRONMENT;
    else process.env.MPESA_ENVIRONMENT = SAVED_MPESA_ENVIRONMENT;
    if (SAVED_MPESA_ENV === undefined) delete process.env.MPESA_ENV;
    else process.env.MPESA_ENV = SAVED_MPESA_ENV;
  });

  it("defaults to sandbox when unset", () => {
    expect(getMpesaDeploymentMode()).toBe("sandbox");
    expect(getMpesaEnvironmentSource()).toBe("default");
  });

  it("uses MPESA_ENVIRONMENT when set", () => {
    process.env.MPESA_ENVIRONMENT = "production";
    expect(getMpesaDeploymentMode()).toBe("production");
    expect(getMpesaEnvironmentSource()).toBe("MPESA_ENVIRONMENT");
  });

  it("MPESA_ENVIRONMENT wins over MPESA_ENV", () => {
    process.env.MPESA_ENVIRONMENT = "sandbox";
    process.env.MPESA_ENV = "production";
    expect(getMpesaDeploymentMode()).toBe("sandbox");
  });

  it("falls back to MPESA_ENV when MPESA_ENVIRONMENT unset", () => {
    process.env.MPESA_ENV = "production";
    expect(getMpesaDeploymentMode()).toBe("production");
    expect(getMpesaEnvironmentSource()).toBe("MPESA_ENV");
  });
});
