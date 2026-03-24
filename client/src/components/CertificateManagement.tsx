import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Download, Eye, RotateCw, Trash2, Search } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/components/ui/use-toast";

interface Certificate {
  id: string;
  staffName: string;
  course: string;
  issueDate: Date;
  expiryDate: Date;
  certificateId: string;
  status: "active" | "revoked" | "expired";
}

interface CertificateManagementProps {
  institutionId: string;
}

export function CertificateManagement({ institutionId }: CertificateManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const { toast } = useToast();

  const { data: certificates, isLoading, refetch } = trpc.institution.getCertificates.useQuery(
    { institutionId },
    { staleTime: 60000 }
  );

  const reissueMutation = trpc.institution.reissueCertificate.useMutation();
  const revokeMutation = trpc.institution.revokeCertificate.useMutation();

  const filteredCerts = certificates?.filter(
    (cert) =>
      cert.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.certificateId.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleReissue = async (certId: string) => {
    try {
      await reissueMutation.mutateAsync({ certificateId: certId });
      toast({
        title: "Success",
        description: "Certificate reissued successfully",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reissue certificate",
        variant: "destructive",
      });
    }
  };

  const handleRevoke = async () => {
    if (!selectedCert || !revokeReason) {
      toast({
        title: "Error",
        description: "Please provide a reason for revocation",
        variant: "destructive",
      });
      return;
    }

    try {
      await revokeMutation.mutateAsync({
        certificateId: selectedCert.id,
        reason: revokeReason,
      });
      toast({
        title: "Success",
        description: "Certificate revoked successfully",
      });
      setRevokeDialogOpen(false);
      setRevokeReason("");
      setSelectedCert(null);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke certificate",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "expired":
        return <Badge className="bg-yellow-100 text-yellow-800">Expired</Badge>;
      case "revoked":
        return <Badge className="bg-red-100 text-red-800">Revoked</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const isExpiringSoon = (expiryDate: Date) => {
    const daysUntilExpiry = Math.floor(
      (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading certificates...</div>;
  }

  const stats = {
    total: certificates?.length || 0,
    active: certificates?.filter((c) => c.status === "active").length || 0,
    expired: certificates?.filter((c) => c.status === "expired").length || 0,
    revoked: certificates?.filter((c) => c.status === "revoked").length || 0,
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Certificates</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Active</div>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Expired</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.expired}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Revoked</div>
          <div className="text-2xl font-bold text-red-600">{stats.revoked}</div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by staff name, course, or certificate ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Certificates Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Staff Name</th>
                <th className="px-4 py-3 text-left font-medium">Course</th>
                <th className="px-4 py-3 text-left font-medium">Certificate ID</th>
                <th className="px-4 py-3 text-left font-medium">Issue Date</th>
                <th className="px-4 py-3 text-left font-medium">Expiry Date</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCerts.map((cert) => (
                <tr
                  key={cert.id}
                  className={`border-b hover:bg-gray-50 ${
                    isExpiringSoon(cert.expiryDate) ? "bg-yellow-50" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-medium">{cert.staffName}</td>
                  <td className="px-4 py-3">{cert.course}</td>
                  <td className="px-4 py-3 font-mono text-xs">{cert.certificateId}</td>
                  <td className="px-4 py-3">
                    {new Date(cert.issueDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {new Date(cert.expiryDate).toLocaleDateString()}
                      {isExpiringSoon(cert.expiryDate) && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Expiring soon
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(cert.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        title="View certificate"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Download certificate"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {cert.status === "active" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReissue(cert.id)}
                            title="Reissue certificate"
                            disabled={reissueMutation.isPending}
                          >
                            <RotateCw className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedCert(cert);
                              setRevokeDialogOpen(true);
                            }}
                            title="Revoke certificate"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revoke Dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Certificate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">
                {selectedCert?.staffName} - {selectedCert?.course}
              </p>
              <p className="text-xs text-gray-600">ID: {selectedCert?.certificateId}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Reason for Revocation</label>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Enter reason for revoking this certificate..."
                className="w-full mt-2 p-2 border rounded-lg text-sm"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRevokeDialogOpen(false);
                setRevokeReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={!revokeReason || revokeMutation.isPending}
            >
              {revokeMutation.isPending ? "Revoking..." : "Revoke Certificate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
