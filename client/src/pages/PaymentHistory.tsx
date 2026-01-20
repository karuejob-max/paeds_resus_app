import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CreditCard,
  Download,
  Filter,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Send,
} from "lucide-react";

interface Payment {
  id: number;
  enrollmentId: number;
  amount: number;
  method: "mpesa" | "bank_transfer" | "card";
  status: "pending" | "partial" | "completed" | "failed";
  date: Date;
  dueDate: Date;
  reference: string;
  description: string;
}

export default function PaymentHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Mock payment data
  const mockPayments: Payment[] = [
    {
      id: 1,
      enrollmentId: 101,
      amount: 5000,
      method: "mpesa",
      status: "completed",
      date: new Date("2026-01-20"),
      dueDate: new Date("2026-01-15"),
      reference: "PRES-2026-001",
      description: "BLS Training - January 2026",
    },
    {
      id: 2,
      enrollmentId: 102,
      amount: 7500,
      method: "bank_transfer",
      status: "completed",
      date: new Date("2026-01-18"),
      dueDate: new Date("2026-01-18"),
      reference: "PRES-2026-002",
      description: "ACLS Training - January 2026",
    },
    {
      id: 3,
      enrollmentId: 103,
      amount: 5000,
      method: "mpesa",
      status: "pending",
      date: new Date("2026-01-20"),
      dueDate: new Date("2026-01-25"),
      reference: "PRES-2026-003",
      description: "PALS Training - January 2026",
    },
    {
      id: 4,
      enrollmentId: 104,
      amount: 15000,
      method: "card",
      status: "partial",
      date: new Date("2026-01-15"),
      dueDate: new Date("2026-01-20"),
      reference: "PRES-2026-004",
      description: "Fellowship Program - January 2026",
    },
    {
      id: 5,
      enrollmentId: 105,
      amount: 5000,
      method: "mpesa",
      status: "failed",
      date: new Date("2026-01-10"),
      dueDate: new Date("2026-01-15"),
      reference: "PRES-2026-005",
      description: "BLS Training - January 2026",
    },
  ];

  const filteredPayments = mockPayments.filter((payment) => {
    const matchesSearch =
      payment.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    const matchesMethod = methodFilter === "all" || payment.method === methodFilter;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "partial":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "partial":
        return <AlertCircle className="w-4 h-4" />;
      case "failed":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "mpesa":
        return "M-Pesa";
      case "bank_transfer":
        return "Bank Transfer";
      case "card":
        return "Credit Card";
      default:
        return method;
    }
  };

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const completedAmount = filteredPayments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = filteredPayments
    .filter((p) => p.status === "pending" || p.status === "partial")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
          </div>
          <p className="text-gray-600">Track and manage all your training payments</p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-sm text-gray-600 mb-2">Total Amount</p>
            <p className="text-3xl font-bold text-gray-900">
              KES {totalAmount.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {filteredPayments.length} transactions
            </p>
          </Card>

          <Card className="p-6 bg-green-50 border-green-200">
            <p className="text-sm text-green-700 mb-2">Completed</p>
            <p className="text-3xl font-bold text-green-900">
              KES {completedAmount.toLocaleString()}
            </p>
            <p className="text-xs text-green-600 mt-2">
              {filteredPayments.filter((p) => p.status === "completed").length} payments
            </p>
          </Card>

          <Card className="p-6 bg-yellow-50 border-yellow-200">
            <p className="text-sm text-yellow-700 mb-2">Pending</p>
            <p className="text-3xl font-bold text-yellow-900">
              KES {pendingAmount.toLocaleString()}
            </p>
            <p className="text-xs text-yellow-600 mt-2">
              {filteredPayments.filter((p) => p.status === "pending" || p.status === "partial").length} payments
            </p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by reference or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="failed">Failed</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Methods</option>
              <option value="mpesa">M-Pesa</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="card">Credit Card</option>
            </select>
          </div>
        </Card>

        {/* Payments Table */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Transactions ({filteredPayments.length})
            </h2>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Reference
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Description
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Method
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {payment.reference}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {payment.description}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                        KES {payment.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {getMethodLabel(payment.method)}
                      </td>
                      <td className="py-3 px-4">
                        <div
                          className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            payment.status
                          )}`}
                        >
                          {getStatusIcon(payment.status)}
                          {payment.status.charAt(0).toUpperCase() +
                            payment.status.slice(1).replace("_", " ")}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {payment.date.toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPayment(payment)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-600">
                      No payments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Payment Details Modal */}
        {selectedPayment && (
          <Card className="p-6 border-2 border-blue-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Reference</p>
                <p className="font-semibold text-gray-900">{selectedPayment.reference}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Amount</p>
                <p className="font-semibold text-gray-900">
                  KES {selectedPayment.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                <p className="font-semibold text-gray-900">
                  {getMethodLabel(selectedPayment.method)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <div
                  className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    selectedPayment.status
                  )}`}
                >
                  {getStatusIcon(selectedPayment.status)}
                  {selectedPayment.status.charAt(0).toUpperCase() +
                    selectedPayment.status.slice(1).replace("_", " ")}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Date</p>
                <p className="font-semibold text-gray-900">
                  {selectedPayment.date.toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Due Date</p>
                <p className="font-semibold text-gray-900">
                  {selectedPayment.dueDate.toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600 mb-2">Description</p>
              <p className="text-gray-900">{selectedPayment.description}</p>
            </div>

            {selectedPayment.status === "pending" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800 mb-3">
                  This payment is pending. Complete payment to secure your training spot.
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Complete Payment
                </Button>
              </div>
            )}

            {selectedPayment.status === "failed" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800 mb-3">
                  This payment failed. Please try again or contact support.
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Retry Payment
                </Button>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
              <Button variant="outline" className="flex-1">
                Contact Support
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
