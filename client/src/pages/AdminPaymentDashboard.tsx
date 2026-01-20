import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  DollarSign, TrendingUp, Users, CreditCard, RefreshCw, Download, Filter, Search,
  CheckCircle2, AlertCircle, Clock, XCircle
} from "lucide-react";

export default function AdminPaymentDashboard() {
  const [dateRange, setDateRange] = useState("30days");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Mock data - replace with real API calls
  const stats = {
    totalRevenue: 4850000,
    totalTransactions: 1243,
    successRate: 94.2,
    averageTransaction: 3900,
  };

  const revenueData = [
    { date: "Jan 1", revenue: 120000, transactions: 45 },
    { date: "Jan 2", revenue: 145000, transactions: 52 },
    { date: "Jan 3", revenue: 98000, transactions: 38 },
    { date: "Jan 4", revenue: 167000, transactions: 61 },
    { date: "Jan 5", revenue: 189000, transactions: 68 },
    { date: "Jan 6", revenue: 156000, transactions: 55 },
    { date: "Jan 7", revenue: 198000, transactions: 72 },
  ];

  const paymentMethodData = [
    { name: "M-Pesa", value: 3200000, percentage: 65.9 },
    { name: "Bank Transfer", value: 1450000, percentage: 29.9 },
    { name: "Card", value: 200000, percentage: 4.1 },
  ];

  const courseBreakdown = [
    { course: "BLS", revenue: 850000, count: 85 },
    { course: "ACLS", revenue: 1200000, count: 60 },
    { course: "PALS", revenue: 950000, count: 47 },
    { course: "Bronze", revenue: 750000, count: 11 },
    { course: "Silver", revenue: 800000, count: 8 },
    { course: "Gold", revenue: 300000, count: 2 },
  ];

  const recentTransactions = [
    {
      id: "TXN001",
      user: "John Mwangi",
      course: "BLS",
      amount: 10000,
      status: "completed",
      method: "M-Pesa",
      date: "2026-01-21 14:30",
    },
    {
      id: "TXN002",
      user: "Sarah Kipchoge",
      course: "ACLS",
      amount: 20000,
      status: "completed",
      method: "Bank",
      date: "2026-01-21 13:15",
    },
    {
      id: "TXN003",
      user: "David Kariuki",
      course: "PALS",
      amount: 20000,
      status: "pending",
      method: "M-Pesa",
      date: "2026-01-21 12:45",
    },
    {
      id: "TXN004",
      user: "Emily Ochieng",
      course: "Bronze",
      amount: 70000,
      status: "completed",
      method: "M-Pesa",
      date: "2026-01-21 11:20",
    },
    {
      id: "TXN005",
      user: "James Kiplagat",
      course: "Silver",
      amount: 100000,
      status: "failed",
      method: "Card",
      date: "2026-01-21 10:05",
    },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b"];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Payment Dashboard</h1>
          <p className="text-blue-100">Real-time payment analytics and transaction management</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-slate-900">
                    KES {(stats.totalRevenue / 1000000).toFixed(1)}M
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Transactions</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalTransactions}</p>
                </div>
                <CreditCard className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Success Rate</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.successRate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Avg Transaction</p>
                  <p className="text-2xl font-bold text-slate-900">
                    KES {stats.averageTransaction.toLocaleString()}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Revenue Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue Trend (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `KES ${value.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `KES ${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Course Revenue Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Revenue by Course</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={courseBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="course" />
                <YAxis />
                <Tooltip formatter={(value) => `KES ${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Last 24 hours</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{tx.user}</p>
                    <p className="text-sm text-slate-600">{tx.course} • {tx.method}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">KES {tx.amount.toLocaleString()}</p>
                    <p className="text-xs text-slate-600">{tx.date}</p>
                  </div>
                  <div className="ml-4">
                    {getStatusBadge(tx.status)}
                  </div>
                  <Button variant="ghost" size="sm" className="ml-4">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
