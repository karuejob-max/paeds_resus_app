import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, Mail, Phone, Briefcase } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StaffListProps {
  institutionId: number;
}

export function StaffList({ institutionId }: StaffListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: staff, isLoading, refetch } = trpc.institution.getStaffMembers.useQuery(
    { institutionId },
    { enabled: !!institutionId }
  );

  const filteredStaff = staff?.filter((member) =>
    member.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.staffEmail.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "enrolled":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "dropped":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCertificationColor = (status: string) => {
    switch (status) {
      case "certified":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "renewal_pending":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Members</CardTitle>
        <CardDescription>
          {filteredStaff.length} of {staff?.length || 0} staff members
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Staff Table */}
        {filteredStaff.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Certification</TableHead>
                  <TableHead>Experience</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member) => (
                  <TableRow key={member.id} className="hover:bg-muted/50">
                    <TableCell className="font-semibold">{member.staffName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {member.staffEmail}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {member.staffRole.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {member.department || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={`capitalize ${getStatusColor(member.enrollmentStatus)}`}>
                        {member.enrollmentStatus.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`capitalize ${getCertificationColor(member.certificationStatus)}`}>
                        {member.certificationStatus.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {member.yearsOfExperience > 0 ? `${member.yearsOfExperience} yrs` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm ? "No staff members match your search" : "No staff members added yet"}
            </p>
          </div>
        )}

        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
