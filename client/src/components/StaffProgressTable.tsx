import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, Download, Mail, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface StaffProgress {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  course: string;
  startDate: Date;
  endDate: Date;
  completionPercent: number;
  status: "not_started" | "in_progress" | "completed" | "overdue";
  lastActivityDate?: Date;
}

interface StaffProgressTableProps {
  institutionId: string;
}

export function StaffProgressTable({ institutionId }: StaffProgressTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: progressData, isLoading } = trpc.institution.getStaffProgress.useQuery(
    { institutionId },
    { staleTime: 60000 }
  );

  const sendReminderMutation = trpc.institution.sendReminder.useMutation();
  const extendDeadlineMutation = trpc.institution.extendDeadline.useMutation();

  // Filter and sort data
  const filteredData = useMemo(() => {
    if (!progressData) return [];

    let filtered = progressData;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Course filter
    if (courseFilter !== "all") {
      filtered = filtered.filter((item) => item.course === courseFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case "completion":
          return b.completionPercent - a.completionPercent;
        case "endDate":
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [progressData, searchTerm, statusFilter, courseFilter, sortBy]);

  // Pagination
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleSendReminder = async (staffId: string) => {
    try {
      await sendReminderMutation.mutateAsync({ staffId });
    } catch (error) {
      console.error("Failed to send reminder:", error);
    }
  };

  const handleExtendDeadline = async (enrollmentId: string, days: number) => {
    try {
      await extendDeadlineMutation.mutateAsync({ enrollmentId, days });
    } catch (error) {
      console.error("Failed to extend deadline:", error);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Course", "Start Date", "End Date", "Completion %", "Status"];
    const rows = filteredData.map((item) => [
      `${item.firstName} ${item.lastName}`,
      item.email,
      item.course,
      new Date(item.startDate).toLocaleDateString(),
      new Date(item.endDate).toLocaleDateString(),
      `${item.completionPercent}%`,
      item.status,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `staff-progress-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading progress data...</div>;
  }

  const courses = [...new Set(progressData?.map((p) => p.course) || [])];

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Staff</div>
          <div className="text-2xl font-bold">{filteredData.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-2xl font-bold text-green-600">
            {filteredData.filter((d) => d.status === "completed").length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">In Progress</div>
          <div className="text-2xl font-bold text-blue-600">
            {filteredData.filter((d) => d.status === "in_progress").length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Overdue</div>
          <div className="text-2xl font-bold text-red-600">
            {filteredData.filter((d) => d.status === "overdue").length}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-64">
          <label className="text-sm font-medium">Search</label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
        </div>

        <div className="min-w-48">
          <label className="text-sm font-medium">Status</label>
          <Select value={statusFilter} onValueChange={(v) => {
            setStatusFilter(v);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-48">
          <label className="text-sm font-medium">Course</label>
          <Select value={courseFilter} onValueChange={(v) => {
            setCourseFilter(v);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course} value={course}>
                  {course}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleExportCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Course</th>
                <th className="px-4 py-3 text-left font-medium">End Date</th>
                <th className="px-4 py-3 text-left font-medium">Completion</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{item.firstName} {item.lastName}</td>
                  <td className="px-4 py-3 text-gray-600">{item.email}</td>
                  <td className="px-4 py-3">{item.course}</td>
                  <td className="px-4 py-3">
                    {new Date(item.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${item.completionPercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{item.completionPercent}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      {getStatusBadge(item.status)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSendReminder(item.id)}
                        title="Send reminder email"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      {item.status === "overdue" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleExtendDeadline(item.id, 7)}
                          title="Extend deadline by 7 days"
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {paginatedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
          {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
