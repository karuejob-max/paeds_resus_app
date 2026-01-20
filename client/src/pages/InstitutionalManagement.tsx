import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Users,
  TrendingUp,
  Calculator,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

export default function InstitutionalManagement() {
  const [activeTab, setActiveTab] = useState<
    "inquiries" | "accounts" | "pricing" | "bulk"
  >("inquiries");
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);

  // Mock data for institutional inquiries
  const mockInquiries = [
    {
      id: 1,
      companyName: "Kenyatta National Hospital",
      staffCount: 450,
      specificNeeds: "BLS and ACLS training for ICU staff",
      contactName: "Dr. James Mwangi",
      contactEmail: "james@knh.go.ke",
      contactPhone: "+254712345678",
      status: "new",
      createdAt: "2026-01-20",
    },
    {
      id: 2,
      companyName: "Aga Khan University Hospital",
      staffCount: 320,
      specificNeeds: "Comprehensive pediatric resuscitation program",
      contactName: "Dr. Sarah Kipchoge",
      contactEmail: "sarah@aku.ac.ke",
      contactPhone: "+254722345678",
      status: "contacted",
      createdAt: "2026-01-18",
    },
    {
      id: 3,
      companyName: "Nairobi Hospital",
      staffCount: 280,
      specificNeeds: "PALS training for pediatric department",
      contactName: "Dr. Michael Ochieng",
      contactEmail: "michael@nairobihospital.co.ke",
      contactPhone: "+254732345678",
      status: "qualified",
      createdAt: "2026-01-15",
    },
  ];

  const mockAccounts = [
    {
      id: 1,
      companyName: "Kenyatta National Hospital",
      industry: "Healthcare",
      staffCount: 450,
      status: "active",
      enrolledStaff: 127,
      totalSpent: 635000,
    },
    {
      id: 2,
      companyName: "Aga Khan University Hospital",
      industry: "Healthcare",
      staffCount: 320,
      status: "active",
      enrolledStaff: 89,
      totalSpent: 445000,
    },
  ];

  const mockPricingPlans = [
    {
      name: "Starter",
      staffCount: "1-50",
      pricePerStaff: 10000,
      features: ["BLS Training", "Basic Support", "1 Year Access"],
    },
    {
      name: "Professional",
      staffCount: "51-200",
      pricePerStaff: 9000,
      features: ["BLS + ACLS", "Priority Support", "2 Year Access", "Bulk Discount"],
    },
    {
      name: "Enterprise",
      staffCount: "200+",
      pricePerStaff: 8000,
      features: [
        "All Programs",
        "Dedicated Manager",
        "Custom Training",
        "3 Year Access",
      ],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "contacted":
        return "bg-yellow-100 text-yellow-800";
      case "qualified":
        return "bg-green-100 text-green-800";
      case "converted":
        return "bg-purple-100 text-purple-800";
      case "active":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Institutional Management
                </h1>
                <p className="text-gray-600">
                  Manage partnerships, inquiries, and bulk training programs
                </p>
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Inquiry
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          {["inquiries", "accounts", "pricing", "bulk"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Inquiries Tab */}
        {activeTab === "inquiries" && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-4">
                <p className="text-sm text-gray-600 mb-1">New Inquiries</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockInquiries.filter((i) => i.status === "new").length}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-gray-600 mb-1">Contacted</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockInquiries.filter((i) => i.status === "contacted").length}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-gray-600 mb-1">Qualified Leads</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockInquiries.filter((i) => i.status === "qualified").length}
                </p>
              </Card>
            </div>

            {/* Inquiries Table */}
            <Card className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Company
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Staff Count
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Contact
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockInquiries.map((inquiry) => (
                      <tr key={inquiry.id} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {inquiry.companyName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {inquiry.specificNeeds}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {inquiry.staffCount}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-900">
                              {inquiry.contactName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {inquiry.contactEmail}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              inquiry.status
                            )}`}
                          >
                            {getStatusLabel(inquiry.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Mail className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Accounts Tab */}
        {activeTab === "accounts" && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-4">
                <p className="text-sm text-gray-600 mb-1">Active Accounts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockAccounts.length}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-gray-600 mb-1">Total Enrolled Staff</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockAccounts.reduce((sum, a) => sum + a.enrolledStaff, 0)}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  KES{" "}
                  {(
                    mockAccounts.reduce((sum, a) => sum + a.totalSpent, 0) / 1000000
                  ).toFixed(1)}
                  M
                </p>
              </Card>
            </div>

            {/* Accounts Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {mockAccounts.map((account) => (
                <Card key={account.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {account.companyName}
                      </h3>
                      <p className="text-sm text-gray-600">{account.industry}</p>
                    </div>
                    <span
                      className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        account.status
                      )}`}
                    >
                      {getStatusLabel(account.status)}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {account.staffCount} total staff
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {account.enrolledStaff} enrolled
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">
                        KES {(account.totalSpent / 1000000).toFixed(2)}M spent
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === "pricing" && (
          <div className="space-y-6">
            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-4">
                <Calculator className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Pricing Calculator
                  </h3>
                  <p className="text-sm text-blue-800">
                    Use our pricing calculator to generate custom quotes for institutional
                    partners based on staff count and program selection.
                  </p>
                </div>
              </div>
            </Card>

            {/* Pricing Plans */}
            <div className="grid md:grid-cols-3 gap-6">
              {mockPricingPlans.map((plan, idx) => (
                <Card
                  key={idx}
                  className={`p-6 ${
                    plan.name === "Professional"
                      ? "border-blue-500 border-2 bg-blue-50"
                      : ""
                  }`}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">{plan.staffCount} staff</p>

                  <div className="mb-6">
                    <p className="text-3xl font-bold text-gray-900">
                      KES {plan.pricePerStaff.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600">per staff member</p>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${
                      plan.name === "Professional"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                    }`}
                  >
                    Select Plan
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Bulk Training Tab */}
        {activeTab === "bulk" && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Bulk Training Programs
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Program Features
                </h3>
                <ul className="space-y-3">
                  {[
                    "Customized training schedules",
                    "On-site or online delivery",
                    "Dedicated training coordinator",
                    "Progress tracking dashboard",
                    "Bulk certificate issuance",
                    "Post-training support",
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Quick Quote Generator
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Staff
                    </label>
                    <Input type="number" placeholder="e.g., 100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Program Type
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option>BLS</option>
                      <option>ACLS</option>
                      <option>PALS</option>
                      <option>Mixed Programs</option>
                    </select>
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Generate Quote
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
