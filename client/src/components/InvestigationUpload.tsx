import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Upload, CheckCircle, Loader } from "lucide-react";

interface InvestigationUploadProps {
  patientId: number;
  onSuccess?: () => void;
}

export function InvestigationUpload({ patientId, onSuccess }: InvestigationUploadProps) {
  const [investigationType, setInvestigationType] = useState<"lab" | "imaging" | "other">("lab");
  const [testName, setTestName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const uploadMutation = trpc.investigations.uploadInvestigation.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setErrorMessage("File size must be less than 10MB");
        setUploadStatus("error");
        return;
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/tiff",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        setErrorMessage("File type not supported. Please upload PDF, image, or spreadsheet files.");
        setUploadStatus("error");
        return;
      }

      setFile(selectedFile);
      setUploadStatus("idle");
      setErrorMessage("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!testName.trim()) {
      setErrorMessage("Please enter a test name");
      setUploadStatus("error");
      return;
    }

    if (!file) {
      setErrorMessage("Please select a file to upload");
      setUploadStatus("error");
      return;
    }

    setIsLoading(true);

    try {
      await uploadMutation.mutateAsync({
        patientId,
        investigationType,
        testName,
        description,
      });

      setUploadStatus("success");
      setTestName("");
      setDescription("");
      setFile(null);
      setErrorMessage("");

      // Reset form after 2 seconds
      setTimeout(() => {
        setUploadStatus("idle");
        onSuccess?.();
      }, 2000);
    } catch (error) {
      setUploadStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Upload Investigation</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Investigation Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Investigation Type</label>
          <select
            value={investigationType}
            onChange={(e) => setInvestigationType(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="lab">Lab Test</option>
            <option value="imaging">Imaging</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Test Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Test Name</label>
          <input
            type="text"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            placeholder="e.g., Complete Blood Count, Chest X-Ray"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any relevant notes about this investigation"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">Upload File</label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  {file ? file.name : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-gray-400">PDF, Images, or Spreadsheets (Max 10MB)</p>
              </div>
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.tiff,.xls,.xlsx"
              />
            </label>
          </div>
        </div>

        {/* Status Messages */}
        {uploadStatus === "error" && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm text-red-700">{errorMessage}</span>
          </div>
        )}

        {uploadStatus === "success" && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700">Investigation uploaded successfully!</span>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading || !testName.trim() || !file}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Investigation
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
