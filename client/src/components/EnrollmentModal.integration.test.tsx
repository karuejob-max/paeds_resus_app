/**
 * Integration tests for EnrollmentModal component
 * Paths: admin-free, promo-code, M-Pesa (reconciliation UI mocked)
 */

import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EnrollmentModal } from "./EnrollmentModal";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";

vi.mock("./MpesaReconciliationStatus", () => ({
  MpesaReconciliationStatus: () => (
    <div data-testid="mpesa-reconciliation-ui">M-Pesa reconciliation</div>
  ),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    enrollment: {
      validatePromo: {
        useMutation: vi.fn(),
      },
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
  let mockValidatePromo: { mutateAsync: ReturnType<typeof vi.fn> };

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mockEnrollWithPayment = {
      mutateAsync: vi.fn(),
    };
    mockValidatePromo = {
      mutateAsync: vi.fn(),
    };

    vi.mocked(trpc.enrollment.enrollWithPayment.useMutation).mockReturnValue(
      mockEnrollWithPayment as unknown as ReturnType<
        typeof trpc.enrollment.enrollWithPayment.useMutation
      >
    );
    vi.mocked(trpc.enrollment.validatePromo.useMutation).mockReturnValue(
      mockValidatePromo as unknown as ReturnType<typeof trpc.enrollment.validatePromo.useMutation>
    );
    vi.mocked(trpc.useUtils).mockReturnValue({
      courses: {
        getUserEnrollments: {
          invalidate: vi.fn(),
        },
      },
    } as ReturnType<typeof trpc.useUtils>);
  });

  describe("Admin-Free Path", () => {
    it("should show admin-free button for admin users", () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, role: "admin", name: "Admin User" },
      });

      render(
        <EnrollmentModal
          course={mockCourse}
          isOpen={true}
          onClose={vi.fn()}
          onEnrollmentSuccess={vi.fn()}
        />
      );

      expect(screen.getByText(/Enroll \(Admin - Free\)/i)).toBeInTheDocument();
    });

    it("should not show admin-free button for regular users", () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, role: "user", name: "Regular User" },
      });

      render(
        <EnrollmentModal
          course={mockCourse}
          isOpen={true}
          onClose={vi.fn()}
          onEnrollmentSuccess={vi.fn()}
        />
      );

      expect(screen.queryByText(/Enroll \(Admin - Free\)/i)).not.toBeInTheDocument();
    });

    it("should call enrollWithPayment without promo code for admin users", async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue({
        user: { id: 1, role: "admin", name: "Admin User" },
      });

      mockEnrollWithPayment.mutateAsync.mockResolvedValueOnce({
        success: true,
        enrollmentId: 100,
        paymentMethod: "admin-free",
      });

      const onSuccess = vi.fn();
      render(
        <EnrollmentModal
          course={mockCourse}
          isOpen={true}
          onClose={vi.fn()}
          onEnrollmentSuccess={onSuccess}
        />
      );

      const adminButton = screen.getByText(/Enroll \(Admin - Free\)/i);
      await user.click(adminButton);

      await waitFor(() => {
        expect(mockEnrollWithPayment.mutateAsync).toHaveBeenCalledWith({
          courseId: "asthma-i",
        });
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it("should show success message after admin enrollment", async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue({
        user: { id: 1, role: "admin", name: "Admin User" },
      });

      mockEnrollWithPayment.mutateAsync.mockResolvedValueOnce({
        success: true,
        enrollmentId: 100,
        paymentMethod: "admin-free",
      });

      render(
        <EnrollmentModal
          course={mockCourse}
          isOpen={true}
          onClose={vi.fn()}
          onEnrollmentSuccess={vi.fn()}
        />
      );

      const adminButton = screen.getByText(/Enroll \(Admin - Free\)/i);
      await user.click(adminButton);

      await waitFor(() => {
        expect(screen.getByText(/Enrollment Successful!/i)).toBeInTheDocument();
      });
    });
  });

  describe("Promo Code Path", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, role: "user", name: "Regular User" },
      });
    });

    it("should navigate to promo code step when 'Have a Promo Code?' is clicked", async () => {
      const user = userEvent.setup();
      render(
        <EnrollmentModal
          course={mockCourse}
          isOpen={true}
          onClose={vi.fn()}
          onEnrollmentSuccess={vi.fn()}
        />
      );

      const promoButton = screen.getByText(/Have a Promo Code\?/i);
      await user.click(promoButton);

      expect(screen.getByPlaceholderText(/PROMO123/i)).toBeInTheDocument();
    });

    it("should validate promo code and apply discount", async () => {
      const user = userEvent.setup();
      mockValidatePromo.mutateAsync.mockResolvedValueOnce({
        valid: true,
        discount_percent: 50,
      });

      mockEnrollWithPayment.mutateAsync.mockResolvedValueOnce({
        success: true,
        enrollmentId: 101,
        paymentMethod: "promo-code",
        amountPaid: 10000,
      });

      render(
        <EnrollmentModal
          course={mockCourse}
          isOpen={true}
          onClose={vi.fn()}
          onEnrollmentSuccess={vi.fn()}
        />
      );

      await user.click(screen.getByText(/Have a Promo Code\?/i));

      const promoInput = screen.getByPlaceholderText(/PROMO123/i);
      await user.type(promoInput, "HALF50");

      const validateButton = screen.getByText(/Validate Code/i);
      await user.click(validateButton);

      await waitFor(() => {
        expect(mockValidatePromo.mutateAsync).toHaveBeenCalledWith({
          code: "HALF50",
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/Discount Applied: 50%/i)).toBeInTheDocument();
      });
    });

    it("should handle 100% discount promo code (free)", async () => {
      const user = userEvent.setup();
      mockValidatePromo.mutateAsync.mockResolvedValueOnce({
        valid: true,
        discount_percent: 100,
      });

      mockEnrollWithPayment.mutateAsync.mockResolvedValueOnce({
        success: true,
        enrollmentId: 102,
        paymentMethod: "promo-code",
        amountPaid: 0,
      });

      render(
        <EnrollmentModal
          course={mockCourse}
          isOpen={true}
          onClose={vi.fn()}
          onEnrollmentSuccess={vi.fn()}
        />
      );

      await user.click(screen.getByText(/Have a Promo Code\?/i));

      const promoInput = screen.getByPlaceholderText(/PROMO123/i);
      await user.type(promoInput, "FREE100");

      await user.click(screen.getByText(/Validate Code/i));

      await waitFor(() => {
        expect(mockEnrollWithPayment.mutateAsync).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText(/Enrollment Successful!/i)).toBeInTheDocument();
      });
    });

    it("should reject invalid promo code", async () => {
      const user = userEvent.setup();
      mockValidatePromo.mutateAsync.mockResolvedValueOnce({
        valid: false,
        message: "Invalid code",
      });

      render(
        <EnrollmentModal
          course={mockCourse}
          isOpen={true}
          onClose={vi.fn()}
          onEnrollmentSuccess={vi.fn()}
        />
      );

      await user.click(screen.getByText(/Have a Promo Code\?/i));

      const promoInput = screen.getByPlaceholderText(/PROMO123/i);
      await user.type(promoInput, "INVALID");

      await user.click(screen.getByText(/Validate Code/i));

      await waitFor(() => {
        expect(screen.getByText(/Invalid promo code/i)).toBeInTheDocument();
      });
    });

    it("should disable validate button when promo code is empty", () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, role: "user", name: "Regular User" },
      });

      render(
        <EnrollmentModal
          course={mockCourse}
          isOpen={true}
          onClose={vi.fn()}
          onEnrollmentSuccess={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText(/Have a Promo Code\?/i));

      const validateButton = screen.getByText(/Validate Code/i);
      expect(validateButton).toBeDisabled();
    });
  });

  describe("M-Pesa Payment Path", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, role: "user", name: "Regular User" },
      });
    });

    it("should navigate to payment step when 'Continue to Payment' is clicked", async () => {
      const user = userEvent.setup();
      render(
        <EnrollmentModal
          course={mockCourse}
          isOpen={true}
          onClose={vi.fn()}
          onEnrollmentSuccess={vi.fn()}
        />
      );

      const paymentButton = screen.getByText(/Continue to Payment/i);
      await user.click(paymentButton);

      expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
    });

    it("should require phone number for M-Pesa payment", async () => {
      const user = userEvent.setup();
      render(
        <EnrollmentModal
          course={mockCourse}
          isOpen={true}
          onClose={vi.fn()}
          onEnrollmentSuccess={vi.fn()}
        />
      );

      await user.click(screen.getByText(/Continue to Payment/i));

      const payButton = screen.getByText(/Pay with M-Pesa/i);
      expect(payButton).toBeDisabled();
    });

    it("should initiate M-Pesa payment and show reconciliation UI", async () => {
      const user = userEvent.setup();
      mockEnrollWithPayment.mutateAsync.mockResolvedValueOnce({
        success: true,
        enrollmentId: 103,
        paymentMethod: "m-pesa",
        checkoutRequestId: "ws_CO_DMZ_123456789",
        amountPaid: 20000,
      });

      render(
        <EnrollmentModal
          course={mockCourse}
          isOpen={true}
          onClose={vi.fn()}
          onEnrollmentSuccess={vi.fn()}
        />
      );

      await user.click(screen.getByText(/Continue to Payment/i));

      const phoneInput = screen.getByLabelText(/Phone Number/i);
      await user.type(phoneInput, "0712345678");

      const payButton = screen.getByText(/Pay with M-Pesa/i);
      await user.click(payButton);

      await waitFor(() => {
        expect(mockEnrollWithPayment.mutateAsync).toHaveBeenCalledWith({
          courseId: "asthma-i",
          phoneNumber: "0712345678",
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId("mpesa-reconciliation-ui")).toBeInTheDocument();
      });
    });

    it("should handle M-Pesa payment failure", async () => {
      const user = userEvent.setup();
      mockEnrollWithPayment.mutateAsync.mockResolvedValueOnce({
        success: false,
        error: "Failed to initiate M-Pesa payment",
      });

      render(
        <EnrollmentModal
          course={mockCourse}
          isOpen={true}
          onClose={vi.fn()}
          onEnrollmentSuccess={vi.fn()}
        />
      );

      await user.click(screen.getByText(/Continue to Payment/i));

      const phoneInput = screen.getByLabelText(/Phone Number/i);
      await user.type(phoneInput, "0712345678");

      const payButton = screen.getByText(/Pay with M-Pesa/i);
      await user.click(payButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to initiate M-Pesa payment/i)).toBeInTheDocument();
      });
    });

    it("should show course cost in payment step", async () => {
      const user = userEvent.setup();
      render(
        <EnrollmentModal
          course={mockCourse}
          isOpen={true}
          onClose={vi.fn()}
          onEnrollmentSuccess={vi.fn()}
        />
      );

      await user.click(screen.getByText(/Continue to Payment/i));

      expect(screen.getByText(/Amount to Pay: KES 200.00/i)).toBeInTheDocument();
    });
  });

  describe("Navigation and Edge Cases", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, role: "user", name: "Regular User" },
      });
    });

    it("should close modal when onClose is called", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const { rerender } = render(
        <EnrollmentModal
          course={mockCourse}
          isOpen={true}
          onClose={onClose}
          onEnrollmentSuccess={vi.fn()}
        />
      );

      expect(screen.getByText(/Enroll in Asthma Management I/i)).toBeInTheDocument();

      rerender(
        <EnrollmentModal
          course={mockCourse}
          isOpen={false}
          onClose={onClose}
          onEnrollmentSuccess={vi.fn()}
        />
      );

      expect(screen.queryByText(/Enroll in Asthma Management I/i)).not.toBeInTheDocument();
    });

    it("should handle back navigation from promo step", async () => {
      const user = userEvent.setup();
      render(
        <EnrollmentModal
          course={mockCourse}
          isOpen={true}
          onClose={vi.fn()}
          onEnrollmentSuccess={vi.fn()}
        />
      );

      await user.click(screen.getByText(/Have a Promo Code\?/i));

      const backButtons = screen.getAllByText(/^Back$/i);
      await user.click(backButtons[0]);

      expect(screen.getByText(/Have a Promo Code\?/i)).toBeInTheDocument();
    });

    it("should display course details in initial step", () => {
      render(
        <EnrollmentModal
          course={mockCourse}
          isOpen={true}
          onClose={vi.fn()}
          onEnrollmentSuccess={vi.fn()}
        />
      );

      expect(screen.getByText(/Course Cost: KES 200.00/i)).toBeInTheDocument();
      expect(screen.getByText(/Level: foundational/i)).toBeInTheDocument();
    });
  });
});
