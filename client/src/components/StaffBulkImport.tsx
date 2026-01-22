import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, Upload, Download, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Papa from "papaparse";

interface StaffRow {
  staffName: string;
  staffEmail: string;
  staffPhone?: string;
  staffRole: "doctor" | "nurse" | "paramedic" | "midwife" | "lab_tech" | "respiratory_therapist" | "support_staff" | "other";
  department?: string;
  yearsOfExperience?: number;
}

interface ImportResult {
  staffEmail: string;
  staffId?: number;
  error?: string;
}

export default function StaffBulkImport({ institutionId }: { institutionId: number }) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bulkImportMutation = trpc.institution.bulkImportStaff.useMutation({
    onSuccess: (data) => {
      setResults(data.data?.imported || []);
      setShowResults(true);
      setIsProcessing(false);
      setProgress(100);
    },
    onError: (error) => {
      setResults([{ staffEmail: "error", error: error.message }]);
      setShowResults(true);
      setIsProcessing(false);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResults([]);
      setShowResults(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      ["staffName", "staffEmail", "staffPhone", "staffRole", "department", "yearsOfExperience"],
      [
        "John Doe",
        "john.doe@hospital.com",
        "+254712345678",
        "nurse",
        "Emergency",
        "5",
      ],
      [
        "Jane Smith",
        "jane.smith@hospital.com",
        "+254712345679",
        "doctor",
        "Pediatrics",
        "8",
      ],
    ];

    const csv = template.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "staff-import-template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: any) => {
        try {
          setProgress(30);

          const staff: StaffRow[] = results.data
            .filter((row: any) => row.staffName && row.staffEmail)
            .map((row: any) => ({
              staffName: row.staffName.trim(),
              staffEmail: row.staffEmail.trim(),
              staffPhone: row.staffPhone?.trim() || undefined,
              staffRole: (row.staffRole?.trim() || "other").toLowerCase() as "doctor" | "nurse" | "paramedic" | "midwife" | "lab_tech" | "respiratory_therapist" | "support_staff" | "other",
              department: row.department?.trim() || undefined,
              yearsOfExperience: row.yearsOfExperience
                ? parseInt(row.yearsOfExperience)
                : undefined,
            }));

          if (staff.length === 0) {
            throw new Error("No valid staff records found in CSV");
          }

          setProgress(60);

          // Validate staff roles
          const validRoles: Array<"doctor" | "nurse" | "paramedic" | "midwife" | "lab_tech" | "respiratory_therapist" | "support_staff" | "other"> = [
            "doctor",
            "nurse",
            "paramedic",
            "midwife",
            "lab_tech",
            "respiratory_therapist",
            "support_staff",
            "other",
          ];

          const invalidRoles = staff.filter((s) => !validRoles.includes(s.staffRole as any));
          if (invalidRoles.length > 0) {
            throw new Error(
              `Invalid staff roles found: ${invalidRoles.map((s) => s.staffRole).join(", ")}`
            );
          }

          setProgress(80);

          // Call tRPC mutation
          bulkImportMutation.mutate({
            institutionId,
            staff,
          });
        } catch (error) {
          setResults([
            {
              staffEmail: "error",
              error: error instanceof Error ? error.message : "Import failed",
            },
          ]);
          setShowResults(true);
          setIsProcessing(false);
        }
      },
      error: (error: any) => {
        setResults([
          {
            staffEmail: "error",
            error: `CSV parsing error: ${error.message}`,
          },
        ]);
        setShowResults(true);
        setIsProcessing(false);
      },
    });
  };

  const successCount = results.filter((r) => r.staffId).length;
  const errorCount = results.filter((r) => r.error).length;

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Import Staff</CardTitle>
          <CardDescription>
            Upload a CSV file to import multiple staff members at once
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Download */}
          <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Download className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Need a template?</p>
              <p className="text-sm text-blue-700">
                Download our CSV template to see the required format
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select CSV File
            </label>
            <div
              className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">
                {file ? file.name : "Click to select CSV file"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Maximum file size: 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Required Columns Info */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-slate-900 mb-2">Required Columns:</p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• <strong>staffName</strong> - Full name of staff member</li>
              <li>• <strong>staffEmail</strong> - Email address (must be unique)</li>
              <li>• <strong>staffRole</strong> - One of: doctor, nurse, paramedic, midwife, lab_tech, respiratory_therapist, support_staff, other (required)</li>
              <li>• staffPhone - Phone number (optional)</li>
              <li>• department - Department name (optional)</li>
              <li>• yearsOfExperience - Years of experience (optional)</li>
            </ul>
          </div>

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={!file || isProcessing}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing... {progress}%
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import Staff Members
              </>
            )}
          </Button>

          {isProcessing && <Progress value={progress} className="w-full" />}
        </CardContent>
      </Card>

      {/* Results Section */}
      {showResults && (
        <Card className={successCount > 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {successCount > 0 ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-green-900">Import Complete</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-900">Import Failed</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {successCount > 0 && (
              <div className="text-sm text-green-800">
                <p className="font-medium">
                  ✓ Successfully imported {successCount} staff member{successCount !== 1 ? "s" : ""}
                </p>
              </div>
            )}

            {errorCount > 0 && (
              <div className="text-sm text-red-800">
                <p className="font-medium mb-2">
                  ✗ {errorCount} error{errorCount !== 1 ? "s" : ""} during import:
                </p>
                <ul className="space-y-1 ml-4">
                  {results
                    .filter((r) => r.error)
                    .map((result, idx) => (
                      <li key={idx} className="text-xs">
                        {result.staffEmail}: {result.error}
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {successCount > 0 && (
              <div className="mt-4 pt-4 border-t border-green-200">
                <p className="text-sm font-medium text-green-900 mb-2">Imported Staff:</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {results
                    .filter((r) => r.staffId)
                    .map((result, idx) => (
                      <p key={idx} className="text-xs text-green-800">
                        • {result.staffEmail}
                      </p>
                    ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => {
                setFile(null);
                setResults([]);
                setShowResults(false);
                setProgress(0);
              }}
              variant="outline"
              className="w-full mt-4"
            >
              Import Another File
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
