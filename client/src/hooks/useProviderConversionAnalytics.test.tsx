import { useEffect, useRef } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
} from "@tanstack/react-query";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { trpc } from "@/lib/trpc";
import { useProviderConversionAnalytics } from "./useProviderConversionAnalytics";
import { useAnalytics } from "./useAnalytics";
import { EnrollmentModal } from "@/components/EnrollmentModal";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    events: { trackEvent: { useMutation: vi.fn() } },
    mpesa: {
      getClientPaymentCapabilities: {
        useQuery: () => ({ data: { stkPushOffered: true } }),
      },
    },
    enrollment: {
      enrollWithPayment: { useMutation: vi.fn() },
      validatePromo: { useQuery: () => ({ data: undefined }) },
    },
    useUtils: () => ({
      courses: {
        getUserEnrollments: {
          invalidate: vi.fn().mockResolvedValue(undefined),
        },
      },
    }),
  },
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: 1, role: "user", name: "Test User" } }),
}));

const sendEvent = vi.fn<(input: unknown) => Promise<unknown>>();
const startPayment = vi.fn<(input: unknown) => Promise<unknown>>();
let client: QueryClient;
function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  sessionStorage.clear();
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  sendEvent.mockReset().mockResolvedValue({ success: true });
  startPayment
    .mockReset()
    .mockResolvedValue({
      success: true,
      enrollmentId: 100,
      learningEnrollmentId: 100,
      paymentCompleted: true,
    });
  // Real useMutation produces pending/success/error state and fresh result objects.
  vi.mocked(trpc.events.trackEvent.useMutation).mockImplementation((() =>
    useMutation({ mutationFn: sendEvent })) as never);
  vi.mocked(trpc.enrollment.enrollWithPayment.useMutation).mockImplementation(
    (() => useMutation({ mutationFn: startPayment })) as never
  );
});
afterEach(() => {
  cleanup();
  client.clear();
});

function EffectConsumer({ pageUrl = "/payment" }: { pageUrl?: string }) {
  const { track } = useProviderConversionAnalytics(pageUrl);
  const renders = useRef(0);
  renders.current += 1;
  // These mirror Payment.tsx's effects and the original modal's [track] effect.
  useEffect(() => {
    track("provider_conversion", "payment_course_selected");
  }, [track]);
  useEffect(() => {
    track("provider_conversion", "payment_method_selected");
  }, [track]);
  return <span data-testid="renders">{renders.current}</span>;
}

describe("stable provider conversion analytics", () => {
  it.each(["success", "error"])(
    "does not flood after real mutation %s rerenders",
    async outcome => {
      // A guard makes the old self-trigger loop fail finitely instead of hanging CI.
      sendEvent.mockImplementation(async () => {
        if (sendEvent.mock.calls.length > 20) return new Promise(() => {});
        if (outcome === "error") throw new Error("offline");
        return { success: true };
      });
      const view = render(<EffectConsumer />, { wrapper: Wrapper });
      await waitFor(() =>
        expect(
          Number(screen.getByTestId("renders").textContent)
        ).toBeGreaterThan(1)
      );
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 40));
      });
      expect(sendEvent).toHaveBeenCalledTimes(2);
      for (let i = 0; i < 10; i++) view.rerender(<EffectConsumer />);
      expect(sendEvent).toHaveBeenCalledTimes(2);
      expect(sendEvent.mock.calls[0][0]).toMatchObject({
        pageUrl: "/payment",
        eventName: "payment_course_selected",
      });
    }
  );

  it("keeps track identity through state changes and updates the page URL intentionally", async () => {
    const { result, rerender } = renderHook(
      ({ page }) => useProviderConversionAnalytics(page),
      {
        initialProps: { page: "/payment" },
        wrapper: Wrapper,
      }
    );
    const originalTrack = result.current.track;
    act(() => result.current.track("provider_conversion", "clicked"));
    await waitFor(() => expect(sendEvent).toHaveBeenCalledTimes(1));
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });
    expect(result.current.track).toBe(originalTrack);
    rerender({ page: "/next" });
    act(() => result.current.track("provider_conversion", "next_click"));
    await waitFor(() => expect(sendEvent).toHaveBeenCalledTimes(2));
    expect(sendEvent.mock.calls[1][0]).toMatchObject({ pageUrl: "/next" });
  });

  it("uses the latest mutate implementation without changing track identity", () => {
    const first = vi.fn();
    const second = vi.fn();
    vi.mocked(trpc.events.trackEvent.useMutation).mockReturnValue({
      mutate: first,
    } as never);
    const { result, rerender } = renderHook(() =>
      useProviderConversionAnalytics("/payment")
    );
    const track = result.current.track;
    act(() => track("provider_conversion", "first"));
    vi.mocked(trpc.events.trackEvent.useMutation).mockReturnValue({
      mutate: second,
    } as never);
    rerender();
    expect(result.current.track).toBe(track);
    act(() => track("provider_conversion", "second"));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("does not drop separate user events to hide a callback loop", async () => {
    const { result } = renderHook(
      () => useProviderConversionAnalytics("/payment"),
      { wrapper: Wrapper }
    );
    act(() => {
      for (let i = 0; i < 10; i++)
        result.current.track("provider_conversion", `action_${i}`);
    });
    await waitFor(() => expect(sendEvent).toHaveBeenCalledTimes(10));
  });

  it("does not flood in the actual unmodified EnrollmentModal or start payment on render", async () => {
    const course = {
      id: 1,
      courseId: "asthma-i",
      title: "Asthma Management I",
      price: 20000,
      level: "foundational" as const,
    };
    const onSuccess = vi.fn();
    const view = render(
      <EnrollmentModal
        course={course}
        isOpen
        onClose={vi.fn()}
        onEnrollmentSuccess={onSuccess}
      />,
      { wrapper: Wrapper }
    );
    await waitFor(() => expect(sendEvent).toHaveBeenCalledTimes(1));
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 25));
    });
    view.rerender(
      <EnrollmentModal
        course={course}
        isOpen
        onClose={vi.fn()}
        onEnrollmentSuccess={onSuccess}
      />
    );
    expect(sendEvent).toHaveBeenCalledTimes(1);
    expect(startPayment).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/M-Pesa phone number/i), {
      target: { value: "0712345678" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Start M-Pesa payment/i })
    );
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(startPayment).toHaveBeenCalledTimes(1);
    expect(sendEvent).toHaveBeenCalledTimes(2);
    expect(startPayment.mock.calls[0][0]).toEqual({
      courseId: "asthma-i",
      phoneNumber: "254712345678",
      paymentPath: "stk_push",
    });
  });
});

describe("general analytics dependency review", () => {
  it("does not self-trigger its page-view effect on mutation state changes", async () => {
    const { rerender } = renderHook(({ page }) => useAnalytics(page), {
      initialProps: { page: "ResusGPS" },
      wrapper: Wrapper,
    });
    await waitFor(() => expect(sendEvent).toHaveBeenCalledTimes(1));
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 25));
    });
    for (let i = 0; i < 5; i++) rerender({ page: "ResusGPS" });
    expect(sendEvent).toHaveBeenCalledTimes(1);
    rerender({ page: "Institutional" });
    await waitFor(() => expect(sendEvent).toHaveBeenCalledTimes(2));
  });
});
