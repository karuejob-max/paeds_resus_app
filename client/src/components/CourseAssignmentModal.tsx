import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/components/ui/use-toast";

const COURSES = [
  { id: "bls", name: "BLS Certification", duration: 7 },
  { id: "acls", name: "ACLS Certification", duration: 14 },
  { id: "pals", name: "PALS Certification", duration: 14 },
  { id: "bronze", name: "Bronze Level", duration: 30 },
  { id: "silver", name: "Silver Level", duration: 60 },
  { id: "gold", name: "Gold Level", duration: 90 },
];

interface CourseAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffMembers: Array<{ id: string; firstName: string; lastName: string }>;
  onSuccess?: () => void;
}

export function CourseAssignmentModal({
  open,
  onOpenChange,
  staffMembers,
  onSuccess,
}: CourseAssignmentModalProps) {
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState<string>("");
  const [selectAll, setSelectAll] = useState(false);
  const { toast } = useToast();

  const assignCourseMutation = trpc.institution.assignCourse.useMutation();

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedStaff(new Set(staffMembers.map((s) => s.id)));
    } else {
      setSelectedStaff(new Set());
    }
  };

  const handleStaffToggle = (staffId: string, checked: boolean) => {
    const newSelected = new Set(selectedStaff);
    if (checked) {
      newSelected.add(staffId);
    } else {
      newSelected.delete(staffId);
    }
    setSelectedStaff(newSelected);
    setSelectAll(newSelected.size === staffMembers.length);
  };

  const calculateEndDate = () => {
    if (!startDate) return "";
    const course = COURSES.find((c) => c.id === selectedCourse);
    if (!course) return "";
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + course.duration);
    return end.toISOString().split("T")[0];
  };

  const handleAssign = async () => {
    if (!selectedCourse || selectedStaff.size === 0 || !startDate) {
      toast({
        title: "Missing Information",
        description: "Please select a course, staff members, and start date",
        variant: "destructive",
      });
      return;
    }

    const endDate = calculateEndDate();

    try {
      await assignCourseMutation.mutateAsync({
        courseId: selectedCourse,
        staffIds: Array.from(selectedStaff),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });

      toast({
        title: "Success",
        description: `Assigned ${selectedStaff.size} staff to ${COURSES.find((c) => c.id === selectedCourse)?.name}`,
      });

      onSuccess?.();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign course. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedCourse("");
    setSelectedStaff(new Set());
    setStartDate("");
    setSelectAll(false);
  };

  const selectedCourseData = COURSES.find((c) => c.id === selectedCourse);
  const endDate = calculateEndDate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Course to Staff</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Selection */}
          <div className="space-y-2">
            <Label htmlFor="course">Select Course</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger id="course">
                <SelectValue placeholder="Choose a course..." />
              </SelectTrigger>
              <SelectContent>
                {COURSES.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name} ({course.duration} days)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <div className="relative">
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10"
                />
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <div className="relative">
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  disabled
                  className="pl-10 bg-gray-50"
                />
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {selectedCourseData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              Duration: {selectedCourseData.duration} days
            </div>
          )}

          {/* Staff Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Select Staff Members</Label>
              <span className="text-sm text-gray-600">
                {selectedStaff.size} of {staffMembers.length} selected
              </span>
            </div>

            {/* Select All */}
            <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
              <Checkbox
                id="selectAll"
                checked={selectAll}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="selectAll" className="cursor-pointer font-medium">
                Select All Staff
              </Label>
            </div>

            {/* Staff List */}
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {staffMembers.map((staff) => (
                <div
                  key={staff.id}
                  className="flex items-center space-x-2 p-3 border-b last:border-b-0 hover:bg-gray-50"
                >
                  <Checkbox
                    id={`staff-${staff.id}`}
                    checked={selectedStaff.has(staff.id)}
                    onCheckedChange={(checked) =>
                      handleStaffToggle(staff.id, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`staff-${staff.id}`}
                    className="cursor-pointer flex-1"
                  >
                    {staff.firstName} {staff.lastName}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={
              !selectedCourse ||
              selectedStaff.size === 0 ||
              !startDate ||
              assignCourseMutation.isPending
            }
          >
            {assignCourseMutation.isPending ? "Assigning..." : "Assign Course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
