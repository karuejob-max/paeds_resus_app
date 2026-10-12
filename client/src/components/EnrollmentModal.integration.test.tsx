/**
 * Integration tests for EnrollmentModal (explicit payment-start flow)
 */

import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EnrollmentModal } from "./EnrollmentModal";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";

vi.mock("@/hooks/useProviderConversionAnalytics", () => ({
  useProviderConversionAnalytics: () => ({ track: vi.fn() }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    enrollment: {
      enrollWithPayment: {
        useMutation: vi.fn(),
      },
    },
    useUtils: vi.fn(),
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

const mockCourse = {
  id: 1,
  courseId: "asthma-i",
  title: "Asthma Management I",
  price: 20000,
  level: "foundational" as const,
};

describe("EnrollmentModal Integration Tests", () => {
  const mockUseAuth = vi.mocked(useAuth);
  let mockEnrollWithPayment: { mutateAsync: ReturnType<typeof vi.fn> };

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mockEnrollWithPayment = { mutateAsync: vi.fn() };
    vi.mocked(trpc.enrollment.enrollWithPayment.useMutation).mockReturnValue(
      mockEnrollWithPayment as unknown as ReturnType<
        typeof trpc.enrollment.enrollWithPayment.useMutation
      >
    );
    vi.mocked(trpc.useUtils).mockReturnValue({
      courses: { getUserEnrollments: { invalidate: vi.fn() } },
    } as ReturnType<typeof trpc.useUtils>);
    mockUseAuth.mockReturnValue({
      user: { id: 1, role: "user", name: "Test User" },
    } as ReturnType<typeof useAuth>);
  });

  it("shows payment confirm step with course details", () => {
    render(
      <EnrollmentModal
        course={mockCourse}
        isOpen={true}
        onClose={vi.fn()}
        onEnrollmentSuccess={vi.fn()}
      />
    );

    expect(
      screen.getByText(/Enroll in Asthma Management I/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/KES 200/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/M-Pesa phone number/i)).toBeInTheDocument();
    expect(screen.getByText(/foundational/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Start M-Pesa payment/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Read assessment policy/i })
    ).toHaveAttribute("href", "/learning/exam-policy#fellowship-microcourses");
  });

  it("enrolls via enrollWithPayment and shows success", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    mockEnrollWithPayment.mutateAsync.mockResolvedValueOnce({
      success: true,
      enrollmentId: 100,
      learningEnrollmentId: 100,
    });

    render(
      <EnrollmentModal
        course={mockCourse}
        isOpen={true}
        onClose={vi.fn()}
        onEnrollmentSuccess={onSuccess}
      />
    );

    await user.type(
      screen.getByLabelText(/M-Pesa phone number/i),
      "0712345678"
    );
    await user.click(
      screen.getByRole("button", { name: /Start M-Pesa payment/i })
    );

    await waitFor(() => {
      expect(mockEnrollWithPayment.mutateAsync).toHaveBeenCalledWith({
        courseId: "asthma-i",
        phoneNumber: "0712345678",
        paymentPath: "stk_push",
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Enrollment Confirmed!/i)).toBeInTheDocument();
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("shows error message when enrollment fails", async () => {
    const user = userEvent.setup();

    mockEnrollWithPayment.mutateAsync.mockResolvedValueOnce({
      success: false,
      error: "Enrollment failed. Please try again.",
    });

    render(
      <EnrollmentModal
        course={mockCourse}
        isOpen={true}
        onClose={vi.fn()}
        onEnrollmentSuccess={vi.fn()}
      />
    );

    await user.type(
      screen.getByLabelText(/M-Pesa phone number/i),
      "0712345678"
    );
    await user.click(
      screen.getByRole("button", { name: /Start M-Pesa payment/i })
    );

    await waitFor(() => {
      expect(mockEnrollWithPayment.mutateAsync).toHaveBeenCalledWith({
        courseId: "asthma-i",
        phoneNumber: "0712345678",
        paymentPath: "stk_push",
      });
    });
    expect(document.body.textContent).toContain(
      "Enrollment failed. Please try again."
    );
  });

  it("does not render when closed", () => {
    render(
      <EnrollmentModal
        course={mockCourse}
        isOpen={false}
        onClose={vi.fn()}
        onEnrollmentSuccess={vi.fn()}
      />
    );

    expect(
      screen.queryByText(/Enroll in Asthma Management I/i)
    ).not.toBeInTheDocument();
  });

  it("requires signed-in user before enrolling", async () => {
    mockUseAuth.mockReturnValue({ user: null } as ReturnType<typeof useAuth>);

    render(
      <EnrollmentModal
        course={mockCourse}
        isOpen={true}
        onClose={vi.fn()}
        onEnrollmentSuccess={vi.fn()}
      />
    );

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: /Start M-Pesa payment/i }));

    expect(mockEnrollWithPayment.mutateAsync).not.toHaveBeenCalled();
  });
});
