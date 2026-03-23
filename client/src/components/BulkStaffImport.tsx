import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, CheckCircle, AlertCircle, Download } from "lucide-react";
import Papa from "papaparse";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BulkStaffImportProps {
  institutionId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface StaffRecord {
  staffName: string;
  staffEmail: string;
  staffPhone?: string;
  staffRole: string;
  department?: string;
  yearsOfExperience?: number;
}

interface ImportResult {
  imported: Array<{ staffEmail: string; staffId: number }>;
  errors: Array<{ staffEmail: string; error: string }>;
}

export function BulkStaffImport({ institutionId, open, onOpenChange, onSuccess }: BulkStaffImportProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<StaffRecord[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");

  const bulkImportMutation = trpc.institution.bulkImportStaff.useMutation();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast({
        title: "Invalid file",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as StaffRecord[];

        // Validate data
        const validData = data.filter((row) => {
          return row.staffName && row.staffEmail && row.staffRole;
        });

        if (validData.length === 0) {
          toast({
            title: "No valid records",
            description: "CSV must contain at least one valid record with Name, Email, and Role",
            variant: "destructive",
          });
          return;
        }

        setParsedData(validData);
        setStep("preview");
      },
      error: (error) => {
        toast({
          title: "Error parsing CSV",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleImport = async () => {
    setIsLoading(true);
    try {
      const result = await bulkImportMutation.mutateAsync({
        institutionId,
        staff: parsedData,
      });

      setImportResult(result.data);
      setStep("result");

      toast({
        title: "Import complete",
        description: `Successfully imported ${result.imported} staff members`,
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `staffName,staffEmail,staffPhone,staffRole,department,yearsOfExperience
John Doe,john@hospital.com,0712345678,nurse,ICU,5
Jane Smith,jane@hospital.com,0712345679,doctor,Emergency,8
Peter Johnson,peter@hospital.com,0712345680,paramedic,Ambulance,3`;

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(template));
    element.setAttribute("download", "staff-import-template.csv");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleClose = () => {
    setStep("upload");
    setParsedData([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onOpenChange(false);
    if (step === "result") {
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bulk Import Staff Members</DialogTitle>
          <DialogDescription>
            Upload a CSV file to add multiple staff members at once
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                CSV must include columns: staffName, staffEmail, staffRole. Other fields are optional.
              </AlertDescription>
            </Alert>

            <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-accent" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-semibold">Click to select CSV file</p>
              <p className="text-sm text-muted-foreground">or drag and drop</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <div className="flex gap-3 justify-between">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
              <Button variant="outline" onClick={() => handleClose()}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Ready to import {parsedData.length} staff members. Review the data below.
              </AlertDescription>
            </Alert>

            <div className="max-h-64 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Role</th>
                    <th className="px-4 py-2 text-left">Department</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.map((staff, idx) => (
                    <tr key={idx} className="border-t hover:bg-muted/50">
                      <td className="px-4 py-2">{staff.staffName}</td>
                      <td className="px-4 py-2">{staff.staffEmail}</td>
                      <td className="px-4 py-2">{staff.staffRole}</td>
                      <td className="px-4 py-2">{staff.department || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("upload");
                  setParsedData([]);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                Back
              </Button>
              <Button onClick={handleImport} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import {parsedData.length} Staff Members
              </Button>
            </div>
          </div>
        )}

        {step === "result" && importResult && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Import completed successfully!</p>
                <p className="text-sm text-green-800">
                  {importResult.imported.length} staff members imported, {importResult.errors.length} errors
                </p>
              </div>
            </div>

            {importResult.imported.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Successfully Imported ({importResult.imported.length})</h4>
                <div className="max-h-40 overflow-y-auto border rounded-lg p-3 bg-green-50">
                  {importResult.imported.map((item, idx) => (
                    <p key={idx} className="text-sm text-green-700">
                      ✓ {item.staffEmail}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {importResult.errors.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-red-600">Errors ({importResult.errors.length})</h4>
                <div className="max-h-40 overflow-y-auto border rounded-lg p-3 bg-red-50">
                  {importResult.errors.map((item, idx) => (
                    <p key={idx} className="text-sm text-red-700">
                      ✗ {item.staffEmail}: {item.error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button onClick={handleClose}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
