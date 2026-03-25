import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, Shield, Users } from "lucide-react";

interface RoleManagementProps {
  institutionId: number;
  staffMemberId: number;
  currentRole?: string;
  staffName: string;
  onRoleChanged?: () => void;
}

const roleInfo = {
  director: {
    label: "Hospital Director",
    description: "Full access to all institutional features and staff management",
    color: "bg-red-100 text-red-800",
    icon: "👑",
  },
  coordinator: {
    label: "Training Coordinator",
    description: "Manage staff enrollments, courses, and track training progress",
    color: "bg-blue-100 text-blue-800",
    icon: "📋",
  },
  finance_officer: {
    label: "Finance Officer",
    description: "View and manage payments, billing, and financial reports",
    color: "bg-green-100 text-green-800",
    icon: "💰",
  },
  department_head: {
    label: "Department Head",
    description: "View and manage only your department's training data",
    color: "bg-purple-100 text-purple-800",
    icon: "👥",
  },
  staff_member: {
    label: "Staff Member",
    description: "View your own training progress and certificates",
    color: "bg-gray-100 text-gray-800",
    icon: "👤",
  },
};

export function RoleManagement({
  institutionId,
  staffMemberId,
  currentRole = "staff_member",
  staffName,
  onRoleChanged,
}: RoleManagementProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [isLoading, setIsLoading] = useState(false);

  const updateRoleMutation = trpc.institution.updateStaffRole.useMutation();

  const handleUpdateRole = async () => {
    if (selectedRole === currentRole) {
      toast({
        title: "No change",
        description: "Please select a different role",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateRoleMutation.mutateAsync({
        institutionId,
        staffMemberId,
        newRole: selectedRole as any,
      });

      toast({
        title: "Role updated",
        description: `${staffName}'s role has been updated to ${roleInfo[selectedRole as keyof typeof roleInfo]?.label || selectedRole}`,
      });

      setOpen(false);
      onRoleChanged?.();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update role",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentRoleInfo = roleInfo[currentRole as keyof typeof roleInfo];

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <Shield className="w-4 h-4" />
        {currentRoleInfo?.label || currentRole}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Role for {staffName}</DialogTitle>
            <DialogDescription>
              Change the institutional role and permissions for this staff member
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Role */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  Current Role
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{currentRoleInfo?.label}</p>
                    <p className="text-sm text-gray-600">{currentRoleInfo?.description}</p>
                  </div>
                  <Badge className={currentRoleInfo?.color}>{currentRoleInfo?.icon}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Role Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Select New Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleInfo).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span>{value.icon}</span>
                        <span>{value.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role Preview */}
            {selectedRole !== currentRole && (
              <Card className="bg-amber-50 border-amber-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <p className="font-semibold text-lg">
                      {roleInfo[selectedRole as keyof typeof roleInfo]?.label}
                    </p>
                    <p className="text-sm text-gray-600">
                      {roleInfo[selectedRole as keyof typeof roleInfo]?.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Permissions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Permissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedRole === "director" && (
                    <>
                      <PermissionItem label="Manage all staff members" />
                      <PermissionItem label="Create and assign courses" />
                      <PermissionItem label="View all progress and reports" />
                      <PermissionItem label="Manage payments and billing" />
                      <PermissionItem label="Update institution settings" />
                      <PermissionItem label="Manage user roles" />
                    </>
                  )}
                  {selectedRole === "coordinator" && (
                    <>
                      <PermissionItem label="Manage staff enrollments" />
                      <PermissionItem label="Assign courses to staff" />
                      <PermissionItem label="Track training progress" />
                      <PermissionItem label="View reports" />
                      <PermissionItem label="Reissue certificates" />
                    </>
                  )}
                  {selectedRole === "finance_officer" && (
                    <>
                      <PermissionItem label="View payment records" />
                      <PermissionItem label="Generate financial reports" />
                      <PermissionItem label="View billing information" />
                    </>
                  )}
                  {selectedRole === "department_head" && (
                    <>
                      <PermissionItem label="View department staff" />
                      <PermissionItem label="View department progress" />
                      <PermissionItem label="View department reports" />
                    </>
                  )}
                  {selectedRole === "staff_member" && (
                    <>
                      <PermissionItem label="View own progress" />
                      <PermissionItem label="View own certificates" />
                      <PermissionItem label="Download certificates" />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateRole}
                disabled={selectedRole === currentRole || isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "Updating..." : "Update Role"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Permission item component
 */
function PermissionItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-700">
      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
      <span>{label}</span>
    </div>
  );
}
