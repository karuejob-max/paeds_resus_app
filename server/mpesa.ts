/**
 * M-Pesa STK entrypoint for `mpesa` tRPC router (`initiatePayment`, etc.).
 *
 * - **Real Daraja** (`./mpesa-real`): calls Safaricom STK Push — user gets PIN prompt on phone.
 * - **Mock** (`./mpesa-mock`): no HTTP to Safaricom — fine for tests / local UI without credentials.
 *
 * Use mock when:
 * - `MPESA_USE_MOCK=1` / `true` / `yes`, or
 * - Vitest (`VITEST` set), unless `MPESA_USE_MOCK=0` is set to force real (rare).
 */
import * as mock from "./mpesa-mock";
import * as real from "./mpesa-real";

function useMockImpl(): boolean {
  const explicit = process.env.MPESA_USE_MOCK?.trim().toLowerCase();
  if (explicit === "0" || explicit === "false" || explicit === "no") {
    return false;
  }
  if (explicit === "1" || explicit === "true" || explicit === "yes") {
    return true;
  }
  if (process.env.VITEST) {
    return true;
  }
  return false;
}

const impl = useMockImpl() ? mock : real;

export const getMpesaAccessToken = impl.getMpesaAccessToken;
export const initiateStkPush = impl.initiateStkPush;
export const queryStk = impl.queryStk;
export const handleMpesaCallback = impl.handleMpesaCallback;
export const validatePhoneNumber = impl.validatePhoneNumber;
