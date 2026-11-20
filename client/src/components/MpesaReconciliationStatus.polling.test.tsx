import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MpesaReconciliationStatus } from "./MpesaReconciliationStatus";

const mocks = vi.hoisted(() => ({ check: vi.fn(), reconcile: vi.fn() }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    mpesa: {
      // Deliberately return a fresh mutation object on every render.
      checkPaymentStatus: {
        useMutation: () => ({ mutateAsync: mocks.check, isPending: false }),
      },
      reconcilePayment: {
        useMutation: () => ({ mutateAsync: mocks.reconcile, isPending: false }),
      },
    },
  },
}));

const baseProps = {
  enrollmentId: 42,
  checkoutRequestId: "checkout-42",
  phoneNumber: "254712345678",
  amount: 12500,
  onPaymentComplete: vi.fn(),
  onRetryPayment: vi.fn(),
};
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("M-Pesa bounded serial polling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    vi.clearAllMocks();
    mocks.check.mockResolvedValue({ status: "pending" });
    mocks.reconcile.mockResolvedValue({ status: "pending" });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("retains its attempt budget through mutation and parent callback rerenders", async () => {
    const view = render(
      <MpesaReconciliationStatus {...baseProps} onPaymentComplete={() => {}} />
    );
    await advance(2500);
    for (let index = 0; index < 23; index += 1) {
      view.rerender(
        <MpesaReconciliationStatus
          {...baseProps}
          onPaymentComplete={() => {}}
        />
      );
      await advance(5000);
    }
    expect(mocks.check).toHaveBeenCalledTimes(24);
    view.rerender(
      <MpesaReconciliationStatus {...baseProps} onPaymentComplete={() => {}} />
    );
    await advance(120000);
    expect(mocks.check).toHaveBeenCalledTimes(24);
    expect(screen.getByText("Payment Not Confirmed")).toBeInTheDocument();
    expect(screen.queryByText("Payment Cancelled")).not.toBeInTheDocument();
  });

  it("stops after three consecutive transport errors in successful HTTP responses", async () => {
    mocks.check.mockResolvedValue({
      status: "pending",
      resultCode: "QUERY_TRANSPORT_ERROR",
      errorMessage: "QUERY_TRANSPORT_ERROR: provider unavailable",
    });
    render(<MpesaReconciliationStatus {...baseProps} />);
    await advance(2500);
    await advance(5000);
    await advance(5000);
    await advance(120000);
    expect(mocks.check).toHaveBeenCalledTimes(3);
    expect(screen.getByText("Payment Not Confirmed")).toBeInTheDocument();
    expect(baseProps.onPaymentComplete).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Retry Payment" })).toBeEnabled();
  });

  it("resets the consecutive-error count only after a non-transport response", async () => {
    mocks.check
      .mockResolvedValueOnce({
        status: "pending",
        errorMessage: "QUERY_TRANSPORT_ERROR",
      })
      .mockResolvedValueOnce({ status: "pending" })
      .mockResolvedValue({
        status: "pending",
        errorMessage: "QUERY_TRANSPORT_ERROR",
      });
    render(<MpesaReconciliationStatus {...baseProps} />);
    await advance(30000);
    expect(mocks.check).toHaveBeenCalledTimes(5);
  });

  it("stops after three rejected requests without marking payment cancelled", async () => {
    mocks.check.mockRejectedValue(new Error("Request timeout"));
    render(<MpesaReconciliationStatus {...baseProps} />);
    await advance(30000);
    expect(mocks.check).toHaveBeenCalledTimes(3);
    expect(screen.queryByText("Payment Cancelled")).not.toBeInTheDocument();
  });

  it("does not overlap 45-second automatic calls or manual checks", async () => {
    const request = deferred<{ status: "pending" }>();
    mocks.check.mockReturnValueOnce(request.promise);
    render(<MpesaReconciliationStatus {...baseProps} />);
    await advance(2500);
    await advance(45000);
    expect(mocks.check).toHaveBeenCalledTimes(1);
    const button = screen.getByRole("button", { name: "Checking..." });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(mocks.reconcile).not.toHaveBeenCalled();
    await act(async () => {
      request.resolve({ status: "pending" });
    });
    await advance(4999);
    expect(mocks.check).toHaveBeenCalledTimes(1);
    await advance(1);
    expect(mocks.check).toHaveBeenCalledTimes(2);
  });

  it("manual requests pause automatic polling and duplicate manual clicks", async () => {
    const request = deferred<{ status: "pending" }>();
    mocks.reconcile.mockReturnValueOnce(request.promise);
    render(<MpesaReconciliationStatus {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /I Have Paid/ }));
    fireEvent.click(screen.getByRole("button", { name: "Checking..." }));
    await advance(45000);
    expect(mocks.reconcile).toHaveBeenCalledTimes(1);
    expect(mocks.check).not.toHaveBeenCalled();
    await act(async () => {
      request.resolve({ status: "pending" });
    });
    await advance(5000);
    expect(mocks.check).toHaveBeenCalledTimes(1);
  });

  it("enforces the wall-clock deadline even while a request is unresolved", async () => {
    const request = deferred<{ status: "pending" }>();
    mocks.check.mockReturnValueOnce(request.promise);
    render(<MpesaReconciliationStatus {...baseProps} />);
    await advance(120000);
    expect(screen.getByText("Payment Not Confirmed")).toBeInTheDocument();
    await act(async () => {
      request.resolve({ status: "pending" });
    });
    await advance(120000);
    expect(mocks.check).toHaveBeenCalledTimes(1);
  });

  it.each(["auto", "manual"])(
    "ignores a late %s completion after unmount",
    async mode => {
      const request = deferred<{ status: "completed" }>();
      (mode === "auto" ? mocks.check : mocks.reconcile).mockReturnValueOnce(
        request.promise
      );
      const view = render(<MpesaReconciliationStatus {...baseProps} />);
      if (mode === "auto") await advance(2500);
      else fireEvent.click(screen.getByRole("button", { name: /I Have Paid/ }));
      view.unmount();
      await act(async () => {
        request.resolve({ status: "completed" });
      });
      await advance(120000);
      expect(baseProps.onPaymentComplete).not.toHaveBeenCalled();
      expect(mocks.check).toHaveBeenCalledTimes(mode === "auto" ? 1 : 0);
    }
  );

  it("ignores an old checkout response and does not overlap the new checkout", async () => {
    const request = deferred<{ status: "completed" }>();
    mocks.check.mockReturnValueOnce(request.promise);
    const view = render(<MpesaReconciliationStatus {...baseProps} />);
    await advance(2500);
    view.rerender(
      <MpesaReconciliationStatus
        {...baseProps}
        checkoutRequestId="new-checkout"
      />
    );
    await advance(2500);
    expect(mocks.check).toHaveBeenCalledTimes(1);
    await act(async () => {
      request.resolve({ status: "completed" });
    });
    expect(baseProps.onPaymentComplete).not.toHaveBeenCalled();
    await advance(5000);
    expect(mocks.check).toHaveBeenLastCalledWith({
      enrollmentId: 42,
      checkoutRequestId: "new-checkout",
    });
  });

  it("uses the latest parent callback without restarting the current request", async () => {
    const request = deferred<{ status: "completed"; transactionId: string }>();
    mocks.check.mockReturnValueOnce(request.promise);
    const oldCallback = vi.fn();
    const newCallback = vi.fn();
    const view = render(
      <MpesaReconciliationStatus
        {...baseProps}
        onPaymentComplete={oldCallback}
      />
    );
    await advance(2500);
    view.rerender(
      <MpesaReconciliationStatus
        {...baseProps}
        onPaymentComplete={newCallback}
      />
    );
    await act(async () => {
      request.resolve({ status: "completed", transactionId: "ABC" });
    });
    expect(oldCallback).not.toHaveBeenCalled();
    expect(newCallback).toHaveBeenCalledTimes(1);
    expect(newCallback).toHaveBeenCalledWith(true);
    await advance(120000);
    expect(mocks.check).toHaveBeenCalledTimes(1);
  });

  it("leaves timeouts unconfirmed even if the response labels them failed", async () => {
    mocks.check.mockResolvedValue({
      status: "failed",
      resultCode: "1037",
      errorMessage: "No response from user / timed out",
    });
    render(<MpesaReconciliationStatus {...baseProps} />);
    await advance(20000);
    expect(screen.getByText("Payment Not Confirmed")).toBeInTheDocument();
    expect(screen.queryByText("Payment Failed")).not.toBeInTheDocument();
    expect(screen.queryByText("Payment Cancelled")).not.toBeInTheDocument();
  });

  it("never queries an empty checkout and does not claim guaranteed prompt delivery", async () => {
    render(<MpesaReconciliationStatus {...baseProps} checkoutRequestId="  " />);
    await advance(120000);
    expect(mocks.check).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /I Have Paid/ })).toBeDisabled();
    expect(document.body.textContent).not.toContain("The prompt was sent");
    expect(document.body.textContent).toContain(
      "Acceptance does not guarantee delivery"
    );
  });
});
