/**
 * Integration tests for EnrollmentModal component
 * Tests all three enrollment paths: M-Pesa, admin-free, promo-code
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EnrollmentModal } from "../EnrollmentModal";
import { trpc } from "@/lib/trpc";

// Mock tRPC
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

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

const mockCourse = {
  id: 1,
  courseId: "asthma-i",
  title: "Asthma Management I",
  price: 20000, // 200 KES in cents
  level: "foundational" as const,
};

describe("EnrollmentModal Integration Tests", () => {
  let mockEnrollWithPayment: any;
  let mockValidatePromo: any;
  let mockUseAuth: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mocks
    mockEnrollWithPayment = {
      mutateAsync: vi.fn(),
    };
    mockValidatePromo = {
      mutateAsync: vi.fn(),
    };

    vi.mocked(trpc.enrollment.enrollWithPayment.useMutation).mockReturnValue(
      mockEnrollWithPayment as any
    );
    vi.mocked(trpc.enrollment.validatePromo.useMutation).mockReturnValue(
      mockValidatePromo as any
    );
    vi.mocked(trpc.useUtils).mockReturnValue({
      courses: {
        getEnrollments: {
          invalidate: vi.fn(),
        },
      },
    } as any);

    const { useAuth } = require("@/hooks/useAuth");
    mockUseAuth = useAuth;
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
      await userEvent.click(adminButton);

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
      await userEvent.click(adminButton);

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
      render(
        <EnrollmentModal
          course={mockCourse}
          isOpen={true}
          onClose={vi.fn()}
          onEnrollmentSuccess={vi.fn()}
        />
      );

      const promoButton = screen.getByText(/Have a Promo Code\?/i);
      await userEvent.click(promoButton);

      expect(screen.getByPlaceholderText(/PROMO123/i)).toBeInTheDocument();
    });

    it("should validate promo code and apply discount", async () => {
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

      // Navigate to promo step
      await userEvent.click(screen.getByText(/Have a Promo Code\?/i));

      // Enter promo code
      const promoInput = screen.getByPlaceholderText(/PROMO123/i);
      await userEvent.type(promoInput, "HALF50");

      // Validate code
      const validateButton = screen.getByText(/Validate Code/i);
      await userEvent.click(validateButton);

      await waitFor(() => {
        expect(mockValidatePromo.mutateAsync).toHaveBeenCalledWith({
          code: "HALF50",
        });
      });

      // Should show payment step with discount applied
      await waitFor(() => {
        expect(screen.getByText(/Discount Applied: 50%/i)).toBeInTheDocument();
      });
    });

    it("should handle 100% discount promo code (free)", async () => {
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

      // Navigate to promo step
      await userEvent.click(screen.getByText(/Have a Promo Code\?/i));

      // Enter promo code
      const promoInput = screen.getByPlaceholderText(/PROMO123/i);
      await userEvent.type(promoInput, "FREE100");

      // Validate code
      await userEvent.click(screen.getByText(/Validate Code/i));

      await waitFor(() => {
        expect(mockEnrollWithPayment.mutateAsync).toHaveBeenCalled();
      });

      // Should show success (100% discount = free enrollment)
      await waitFor(() => {
        expect(screen.getByText(/Enrollment Successful!/i)).toBeInTheDocument();
      });
    });

    it("should reject invalid promo code", async () => {
      mockValidatePromo.mutateAsync.mockResolvedValueOnce({
        valid: false,
        message: "Promo code not found",
      });

      render(
        <EnrollmentModal
          course={mockCourse}
          isOpen={true}
          onClose={vi.fn()}
          onEnrollmentSuccess={vi.fn()}
        />
      );

      // Navigate to promo step
      await userEvent.click(screen.getByText(/Have a Promo Code\?/i));

      // Enter invalid promo code
      const promoInput = screen.getByPlaceholderText(/PROMO123/i);
      await userEvent.type(promoInput, "INVALID");

      // Validate code
      await userEvent.click(screen.getByText(/Validate Code/i));

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

      // Navigate to promo step
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
      render(
        <EnrollmentModal
          course={mockCourse}
          isOpen={true}
          onClose={vi.fn()}
          onEnrollmentSuccess={vi.fn()}
        />
      );

      const paymentButton = screen.getByText(/Continue to Payment/i);
      await userEvent.click(paymentButton);

      expect(screen.getByPlaceholderText(/0712345678/i)).toBeInTheDocument();
    });

    it("should require phone number for M-Pesa payment", async () => {
      render(
        <EnrollmentModal
          course={mockCourse}
          isOpen={true}
          onClose={vi.fn()}
          onEnrollmentSuccess={vi.fn()}
        />
      );

      // Navigate to payment step
      await userEvent.click(screen.getByText(/Continue to Payment/i));

      // Pay button should be disabled without phone
      const payButton = screen.getByText(/Pay with M-Pesa/i);
      expect(payButton).toBeDisabled();
    });

    it("should initiate M-Pesa payment with phone number", async () => {
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

      // Navigate to payment step
      await userEvent.click(screen.getByText(/Continue to Payment/i));

      // Enter phone number
      const phoneInput = screen.getByPlaceholderText(/0712345678/i);
      await userEvent.type(phoneInput, "0712345678");

      // Click pay button
      const payButton = screen.getByText(/Pay with M-Pesa/i);
      await userEvent.click(payButton);

      await waitFor(() => {
        expect(mockEnrollWithPayment.mutateAsync).toHaveBeenCalledWith({
          courseId: "asthma-i",
          phoneNumber: "0712345678",
        });
      });

      // Should show STK push message
      await waitFor(() => {
        expect(screen.getByText(/STK Push sent/i)).toBeInTheDocument();
      });
    });

    it("should handle M-Pesa payment failure", async () => {
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

      // Navigate to payment step
      await userEvent.click(screen.getByText(/Continue to Payment/i));

      // Enter phone and try to pay
      const phoneInput = screen.getByPlaceholderText(/0712345678/i);
      await userEvent.type(phoneInput, "0712345678");

      const payButton = screen.getByText(/Pay with M-Pesa/i);
      await userEvent.click(payButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to initiate M-Pesa payment/i)).toBeInTheDocument();
      });
    });

    it("should show course cost in payment step", async () => {
      render(
        <EnrollmentModal
          course={mockCourse}
          isOpen={true}
          onClose={vi.fn()}
          onEnrollmentSuccess={vi.fn()}
        />
      );

      // Navigate to payment step
      await userEvent.click(screen.getByText(/Continue to Payment/i));

      // Should show amount to pay
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
      const onClose = vi.fn();
      const { rerender } = render(
        <EnrollmentModal
          course={mockCourse}
          isOpen={true}
          onClose={onClose}
          onEnrollmentSuccess={vi.fn()}
        />
      );

      // Modal should be open
      expect(screen.getByText(/Enroll in Asthma Management I/i)).toBeInTheDocument();

      // Rerender with isOpen=false
      rerender(
        <EnrollmentModal
          course={mockCourse}
          isOpen={false}
          onClose={onClose}
          onEnrollmentSuccess={vi.fn()}
        />
      );

      // Modal should be closed
      expect(screen.queryByText(/Enroll in Asthma Management I/i)).not.toBeInTheDocument();
    });

    it("should handle back navigation from promo step", async () => {
      render(
        <EnrollmentModal
          course={mockCourse}
          isOpen={true}
          onClose={vi.fn()}
          onEnrollmentSuccess={vi.fn()}
        />
      );

      // Navigate to promo step
      await userEvent.click(screen.getByText(/Have a Promo Code\?/i));

      // Click back
      const backButtons = screen.getAllByText(/Back/i);
      await userEvent.click(backButtons[0]);

      // Should be back to initial step
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
