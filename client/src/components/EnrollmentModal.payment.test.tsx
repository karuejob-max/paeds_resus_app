import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EnrollmentModal } from "./EnrollmentModal";

const mocks = vi.hoisted(() => ({
  enroll: vi.fn(),
  check: vi.fn(),
  reconcile: vi.fn(),
  invalidate: vi.fn(),
  track: vi.fn(),
  capabilities: vi.fn(),
  auth: vi.fn(),
  promo: vi.fn(),
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => mocks.auth() }));
vi.mock("@/hooks/useProviderConversionAnalytics", () => ({
  useProviderConversionAnalytics: () => ({ track: mocks.track }),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    enrollment: {
      enrollWithPayment: { useMutation: () => ({ mutateAsync: mocks.enroll }) },
      validatePromo: { useQuery: (...args: unknown[]) => mocks.promo(...args) },
    },
    mpesa: {
      getClientPaymentCapabilities: {
        useQuery: (...args: unknown[]) => mocks.capabilities(...args),
      },
      checkPaymentStatus: { useMutation: () => ({ mutateAsync: mocks.check }) },
      reconcilePayment: {
        useMutation: () => ({ mutateAsync: mocks.reconcile }),
      },
    },
    useUtils: () => ({
      courses: { getUserEnrollments: { invalidate: mocks.invalidate } },
    }),
  },
}));
const course = {
  id: 1,
  courseId: "asthma-i",
  title: "Asthma Management I",
  price: 20000,
  level: "foundational" as const,
};
const secondCourse = {
  ...course,
  id: 2,
  courseId: "asthma-ii",
  title: "Asthma Management II",
  price: 35000,
};
const props = {
  course,
  isOpen: true,
  onClose: vi.fn(),
  onEnrollmentSuccess: vi.fn(),
};
function enterPhone() {
  fireEvent.change(screen.getByLabelText(/M-Pesa phone number/), {
    target: { value: "0712345678" },
  });
}
async function submit() {
  await act(async () => {
    fireEvent.click(
      screen.getByRole("button", {
        name: /Start M-Pesa payment|Confirm free enrollment/,
      })
    );
  });
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("Enrollment payment confirmation and modal sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockReturnValue({
      user: { id: 1, role: "user", name: "Learner" },
    });
    mocks.capabilities.mockReturnValue({
      data: { stkPushOffered: true, userMessage: "M-Pesa is available" },
    });
    mocks.promo.mockImplementation((input: { code: string }) => ({
      data: input.code === "FREE" ? { valid: true, finalPrice: 0 } : undefined,
    }));
    mocks.enroll.mockResolvedValue({
      success: true,
      enrollmentId: 10,
      learningEnrollmentId: 90,
      paymentMethod: "m-pesa",
      checkoutRequestId: "stk-10",
      amountPaid: 20000,
    });
    mocks.check.mockResolvedValue({ status: "pending" });
    mocks.reconcile.mockResolvedValue({ status: "pending" });
    mocks.invalidate.mockResolvedValue(undefined);
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it.each([
    { paymentMethod: "admin-free", amountPaid: 0 },
    { paymentMethod: "admin-free" },
    { paymentMethod: "promo-code", amountPaid: 0 },
  ])("confirms no-checkout free access immediately for %j", async result => {
    mocks.enroll.mockResolvedValue({
      success: true,
      enrollmentId: 10,
      learningEnrollmentId: 90,
      ...result,
    });
    render(<EnrollmentModal {...props} />);
    enterPhone();
    await submit();
    expect(screen.getByTestId("enrollment-success-step")).toBeInTheDocument();
    expect(screen.getByTestId("enrollment-receipt")).toHaveTextContent("Free");
    expect(
      screen.queryByTestId("enrollment-reconciliation-step")
    ).not.toBeInTheDocument();
    expect(props.onEnrollmentSuccess).toHaveBeenCalledTimes(1);
    expect(mocks.check).not.toHaveBeenCalled();
  });

  it("sends promo codes with normalized STK requests and shows the server amount, not a client discount", async () => {
    mocks.enroll.mockResolvedValue({
      success: true,
      enrollmentId: 10,
      paymentMethod: "m-pesa",
      checkoutRequestId: "stk-10",
      amountPaid: 13700,
    });
    render(<EnrollmentModal {...props} />);
    enterPhone();
    fireEvent.change(screen.getByLabelText(/Promo or access code/), {
      target: { value: " DISCOUNT25 " },
    });
    await submit();
    expect(mocks.enroll).toHaveBeenCalledWith({
      courseId: "asthma-i",
      phoneNumber: "254712345678",
      promoCode: "DISCOUNT25",
      paymentPath: "stk_push",
    });
    expect(
      screen.getByTestId("enrollment-reconciliation-step")
    ).toHaveTextContent("KES 137.00");
    expect(props.onEnrollmentSuccess).not.toHaveBeenCalled();
    expect(mocks.invalidate).not.toHaveBeenCalled();
    expect(
      screen.queryByTestId("enrollment-success-step")
    ).not.toBeInTheDocument();
  });

  it("allows a server-priced promo zero result without requiring a phone", async () => {
    mocks.enroll.mockResolvedValue({
      success: true,
      enrollmentId: 10,
      paymentMethod: "promo-code",
      amountPaid: 0,
    });
    render(<EnrollmentModal {...props} />);
    fireEvent.change(screen.getByLabelText(/Promo or access code/), {
      target: { value: "FREE" },
    });
    await submit();
    expect(mocks.enroll).toHaveBeenCalledWith({
      courseId: "asthma-i",
      promoCode: "FREE",
      paymentPath: "stk_push",
    });
    expect(screen.getByTestId("enrollment-success-step")).toBeInTheDocument();
  });

  it("does not falsely confirm a paid result with no checkout", async () => {
    mocks.enroll.mockResolvedValue({
      success: true,
      enrollmentId: 10,
      paymentMethod: "m-pesa",
      amountPaid: 20000,
      checkoutRequestId: "",
      previousPaymentUnconfirmed: true,
      message: "M-Pesa initiation timed out; the payment outcome is unknown.",
    });
    render(<EnrollmentModal {...props} />);
    enterPhone();
    await submit();
    expect(
      screen.getByTestId("enrollment-reconciliation-step")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no checkout reference was returned/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "M-Pesa initiation timed out; the payment outcome is unknown."
      )
    ).toBeInTheDocument();
    expect(mocks.check).not.toHaveBeenCalled();
    expect(props.onEnrollmentSuccess).not.toHaveBeenCalled();
  });

  it("allows free admin enrollment while STK capability is false", async () => {
    mocks.auth.mockReturnValue({ user: { id: 1, role: "admin" } });
    mocks.capabilities.mockReturnValue({
      data: { stkPushOffered: false, userMessage: "STK is unavailable." },
    });
    mocks.enroll.mockResolvedValue({
      success: true,
      enrollmentId: 10,
      paymentMethod: "admin-free",
      amountPaid: 0,
    });
    render(<EnrollmentModal {...props} />);
    expect(
      screen.getByRole("button", { name: "Confirm free enrollment" })
    ).toBeEnabled();
    await submit();
    expect(screen.getByTestId("enrollment-success-step")).toBeInTheDocument();
  });

  it("allows server-validated zero promo while STK capability is false", async () => {
    mocks.capabilities.mockReturnValue({
      data: { stkPushOffered: false, userMessage: "STK is unavailable." },
    });
    mocks.enroll.mockResolvedValue({
      success: true,
      enrollmentId: 10,
      paymentMethod: "promo-code",
      amountPaid: 0,
    });
    render(<EnrollmentModal {...props} />);
    fireEvent.change(screen.getByLabelText(/Promo or access code/), {
      target: { value: "FREE" },
    });
    expect(
      screen.getByRole("button", { name: "Confirm free enrollment" })
    ).toBeEnabled();
    await submit();
    expect(screen.getByTestId("enrollment-success-step")).toBeInTheDocument();
  });

  it("requires a phone for partial promos and does not bypass unavailable STK", async () => {
    mocks.promo.mockReturnValue({ data: { valid: true, finalPrice: 15000 } });
    const view = render(<EnrollmentModal {...props} />);
    fireEvent.change(screen.getByLabelText(/Promo or access code/), {
      target: { value: "PARTIAL" },
    });
    await submit();
    expect(mocks.enroll).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("valid Kenyan");
    mocks.capabilities.mockReturnValue({
      data: { stkPushOffered: false, userMessage: "STK is unavailable." },
    });
    view.rerender(<EnrollmentModal {...props} />);
    expect(
      screen.getByRole("button", { name: "Start M-Pesa payment" })
    ).toBeDisabled();
  });

  it("confirms an already completed server payment immediately and uses amountPaid", async () => {
    mocks.enroll.mockResolvedValue({
      success: true,
      enrollmentId: 10,
      paymentMethod: "m-pesa",
      paymentCompleted: true,
      amountPaid: 13700,
    });
    render(<EnrollmentModal {...props} />);
    enterPhone();
    await submit();
    expect(screen.getByTestId("enrollment-success-step")).toBeInTheDocument();
    expect(screen.getByTestId("enrollment-receipt")).toHaveTextContent(
      "KES 137.00"
    );
    expect(props.onEnrollmentSuccess).toHaveBeenCalledTimes(1);
  });

  it("only confirms paid enrollment after reconciliation", async () => {
    vi.useFakeTimers();
    mocks.check.mockResolvedValue({
      status: "completed",
      transactionId: "SMS123",
    });
    render(<EnrollmentModal {...props} />);
    enterPhone();
    await submit();
    expect(props.onEnrollmentSuccess).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500);
    });
    expect(screen.getByTestId("enrollment-success-step")).toBeInTheDocument();
    expect(props.onEnrollmentSuccess).toHaveBeenCalledTimes(1);
    expect(mocks.invalidate).toHaveBeenCalledTimes(1);
  });

  it("gates capabilities queries to authenticated open modals and explains unavailable payments", () => {
    mocks.capabilities.mockReturnValue({
      data: {
        stkPushOffered: false,
        userMessage: "Mobile Money checkout is temporarily turned off.",
      },
    });
    const view = render(<EnrollmentModal {...props} />);
    expect(mocks.capabilities).toHaveBeenLastCalledWith(undefined, {
      enabled: true,
    });
    expect(
      screen.getByRole("button", { name: "Start M-Pesa payment" })
    ).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "temporarily turned off"
    );
    view.rerender(<EnrollmentModal {...props} isOpen={false} />);
    expect(mocks.capabilities).toHaveBeenLastCalledWith(undefined, {
      enabled: false,
    });
    mocks.auth.mockReturnValue({ user: null });
    view.rerender(<EnrollmentModal {...props} />);
    expect(mocks.capabilities).toHaveBeenLastCalledWith(undefined, {
      enabled: false,
    });
    expect(
      screen.getByRole("button", { name: "Start M-Pesa payment" })
    ).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Sign in");
  });

  it("does not start checkout while capability availability is unknown", async () => {
    mocks.capabilities.mockReturnValue({ data: undefined, isLoading: true });
    render(<EnrollmentModal {...props} />);
    enterPhone();
    await submit();
    expect(mocks.enroll).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Checking payment availability"
    );
  });

  it("resets phone, promo, IDs, and receipt when switching courses or reopening", async () => {
    const view = render(<EnrollmentModal {...props} />);
    enterPhone();
    fireEvent.change(screen.getByLabelText(/Promo or access code/), {
      target: { value: "OLDPROMO" },
    });
    await submit();
    expect(
      screen.getByTestId("enrollment-reconciliation-step")
    ).toBeInTheDocument();
    view.rerender(<EnrollmentModal {...props} course={secondCourse} />);
    expect(screen.getByLabelText(/M-Pesa phone number/)).toHaveValue("");
    expect(screen.getByLabelText(/Promo or access code/)).toHaveValue("");
    expect(
      screen.queryByTestId("enrollment-reconciliation-step")
    ).not.toBeInTheDocument();
    enterPhone();
    view.rerender(
      <EnrollmentModal {...props} course={secondCourse} isOpen={false} />
    );
    view.rerender(<EnrollmentModal {...props} course={secondCourse} />);
    expect(screen.getByLabelText(/M-Pesa phone number/)).toHaveValue("");
    expect(
      screen.queryByTestId("enrollment-success-step")
    ).not.toBeInTheDocument();
  });

  it.each(["close", "switch", "unmount"])(
    "ignores late enrollment results on %s",
    async action => {
      const request = deferred<{
        success: true;
        enrollmentId: number;
        paymentMethod: string;
        amountPaid: number;
      }>();
      mocks.enroll.mockReturnValueOnce(request.promise);
      const view = render(<EnrollmentModal {...props} />);
      enterPhone();
      await submit();
      if (action === "unmount") view.unmount();
      else
        view.rerender(
          <EnrollmentModal
            {...props}
            course={action === "switch" ? secondCourse : course}
            isOpen={action !== "close"}
          />
        );
      await act(async () => {
        request.resolve({
          success: true,
          enrollmentId: 99,
          paymentMethod: "admin-free",
          amountPaid: 0,
        });
      });
      expect(props.onEnrollmentSuccess).not.toHaveBeenCalled();
      expect(mocks.invalidate).not.toHaveBeenCalled();
      expect(
        screen.queryByTestId("enrollment-success-step")
      ).not.toBeInTheDocument();
    }
  );

  it("only sends explicit retry intent after the learner presses retry and submits again", async () => {
    render(<EnrollmentModal {...props} />);
    enterPhone();
    await submit();
    expect(mocks.enroll.mock.calls[0][0]).not.toHaveProperty("retryStk");
    fireEvent.click(screen.getByRole("button", { name: "Retry Payment" }));
    expect(
      screen.getByText(
        /Check your M-Pesa SMS first; do not retry if payment was deducted/
      )
    ).toBeInTheDocument();
    await submit();
    expect(mocks.enroll.mock.calls[1][0]).toHaveProperty("retryStk", true);
  });

  it("shows the previous-payment uncertainty warning returned by the server", async () => {
    mocks.enroll.mockResolvedValue({
      success: true,
      enrollmentId: 10,
      paymentMethod: "m-pesa",
      checkoutRequestId: "new-checkout",
      amountPaid: 20000,
      previousPaymentUnconfirmed: true,
    });
    render(<EnrollmentModal {...props} />);
    enterPhone();
    await submit();
    expect(
      screen.getByText(/A previous payment is still unconfirmed/)
    ).toHaveTextContent("do not retry if payment was deducted");
  });

  it("rejects invalid mobile numbers before an API call", async () => {
    render(<EnrollmentModal {...props} />);
    fireEvent.change(screen.getByLabelText(/M-Pesa phone number/), {
      target: { value: "0201234567" },
    });
    await submit();
    expect(mocks.enroll).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "valid Kenyan M-Pesa mobile number"
    );
  });
});
