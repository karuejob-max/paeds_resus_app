/**
 * Integration tests for EnrollmentModal (free instant enrollment flow)
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

  it("shows free enrollment confirm step with course details", () => {
    render(
      <EnrollmentModal
        course={mockCourse}
        isOpen={true}
        onClose={vi.fn()}
        onEnrollmentSuccess={vi.fn()}
      />
    );

    expect(screen.getByText(/Enroll in Asthma Management I/i)).toBeInTheDocument();
    expect(screen.getByText(/Free access/i)).toBeInTheDocument();
    expect(screen.getByText(/foundational/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Enroll Now — Free/i })).toBeInTheDocument();
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

    await user.click(screen.getByRole("button", { name: /Enroll Now — Free/i }));

    await waitFor(() => {
      expect(mockEnrollWithPayment.mutateAsync).toHaveBeenCalledWith({
        courseId: "asthma-i",
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

    await user.click(screen.getByRole("button", { name: /Enroll Now — Free/i }));

    await waitFor(() => {
      expect(screen.getByText(/Enrollment failed/i)).toBeInTheDocument();
    });
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

    expect(screen.queryByText(/Enroll in Asthma Management I/i)).not.toBeInTheDocument();
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

    await userEvent.setup().click(screen.getByRole("button", { name: /Enroll Now — Free/i }));

    expect(mockEnrollWithPayment.mutateAsync).not.toHaveBeenCalled();
  });
});
