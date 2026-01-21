import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Users, Mail, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { useState } from "react";

export default function InstitutionProviderOnboarding() {
  const [step, setStep] = useState<"method" | "import" | "review" | "sent">("method");
  const [importedProviders, setImportedProviders] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<"csv" | "sso" | "manual">("csv");

  const downloadTemplate = () => {
    const template = `name,email,phone,providerType,department
Dr. John Doe,john.doe@hospital.com,+254712345678,doctor,Emergency
Jane Smith,jane.smith@hospital.com,+254712345679,nurse,ICU
Peter Mwangi,peter.mwangi@hospital.com,+254712345680,paramedic,Ambulance`;

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(template));
    element.setAttribute("download", "provider-import-template.csv");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      const lines = csv.split("\n").slice(1); // Skip header
      const providers = lines
        .filter((line) => line.trim())
        .map((line) => {
          const [name, email, phone, providerType, department] = line.split(",");
          return {
            name: name?.trim(),
            email: email?.trim(),
            phone: phone?.trim(),
            providerType: providerType?.trim(),
            department: department?.trim(),
            status: "pending_activation",
          };
        });

      setImportedProviders(providers);
      setStep("review");
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1a4d4d] mb-2">Provider Onboarding</h1>
        <p className="text-gray-600">
          Add healthcare providers to your institution efficiently. Choose from bulk import, SSO, or manual registration.
        </p>
      </div>

      {/* Step 1: Choose Method */}
      {step === "method" && (
        <div className="grid md:grid-cols-3 gap-4">
          {/* CSV Import */}
          <Card
            className={`cursor-pointer border-2 transition ${
              selectedMethod === "csv" ? "border-[#ff6633] bg-orange-50" : "border-gray-200"
            }`}
            onClick={() => setSelectedMethod("csv")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1a4d4d]">
                <Upload className="w-5 h-5" />
                Bulk Import (CSV)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Upload a CSV file with provider details. Fastest way to onboard multiple providers at once.
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>✓ 100+ providers at once</li>
                <li>✓ Auto-generates credentials</li>
                <li>✓ Sends activation emails</li>
              </ul>
            </CardContent>
          </Card>

          {/* SSO */}
          <Card
            className={`cursor-pointer border-2 transition ${
              selectedMethod === "sso" ? "border-[#ff6633] bg-orange-50" : "border-gray-200"
            }`}
            onClick={() => setSelectedMethod("sso")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1a4d4d]">
                <Users className="w-5 h-5" />
                Single Sign-On
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Connect your institution's directory (Google Workspace, Azure AD, Okta).
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>✓ Auto-sync providers</li>
                <li>✓ Highest security</li>
                <li>✓ Zero manual work</li>
              </ul>
            </CardContent>
          </Card>

          {/* Manual */}
          <Card
            className={`cursor-pointer border-2 transition ${
              selectedMethod === "manual" ? "border-[#ff6633] bg-orange-50" : "border-gray-200"
            }`}
            onClick={() => setSelectedMethod("manual")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1a4d4d]">
                <Mail className="w-5 h-5" />
                Manual Registration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Providers register individually with your institution code.
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>✓ Flexible</li>
                <li>✓ Self-service</li>
                <li>✓ Late joiners</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: CSV Import */}
      {step === "method" && selectedMethod === "csv" && (
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          <Button
            className="bg-[#ff6633] hover:bg-[#e55a22]"
            onClick={() => document.getElementById("csv-upload")?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload CSV
          </Button>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Step 3: Review Imports */}
      {step === "review" && importedProviders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1a4d4d]">
              <CheckCircle2 className="w-5 h-5" />
              Review Providers ({importedProviders.length})
            </CardTitle>
            <CardDescription>
              Verify the provider details before sending activation emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-semibold text-[#1a4d4d]">Name</th>
                    <th className="text-left py-2 px-3 font-semibold text-[#1a4d4d]">Email</th>
                    <th className="text-left py-2 px-3 font-semibold text-[#1a4d4d]">Type</th>
                    <th className="text-left py-2 px-3 font-semibold text-[#1a4d4d]">Department</th>
                  </tr>
                </thead>
                <tbody>
                  {importedProviders.map((provider, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3">{provider.name}</td>
                      <td className="py-2 px-3">{provider.email}</td>
                      <td className="py-2 px-3">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {provider.providerType}
                        </span>
                      </td>
                      <td className="py-2 px-3">{provider.department}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setStep("method")}>
                Back
              </Button>
              <Button
                className="bg-[#ff6633] hover:bg-[#e55a22]"
                onClick={() => setStep("sent")}
              >
                Send Activation Emails
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Success */}
      {step === "sent" && (
        <Card className="border-l-4 border-green-500 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              Providers Onboarded Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Providers Imported</p>
                <p className="text-2xl font-bold text-[#1a4d4d]">{importedProviders.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Activation Emails Sent</p>
                <p className="text-2xl font-bold text-[#ff6633]">{importedProviders.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Activation Link Expiry</p>
                <p className="text-2xl font-bold text-[#1a4d4d]">7 days</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-[#1a4d4d] mb-2">What Happens Next:</h3>
              <ol className="space-y-2 text-sm text-gray-700">
                <li>1. Each provider receives an activation email with a unique link</li>
                <li>2. They click the link and create their password</li>
                <li>3. They're automatically linked to your institution</li>
                <li>4. They can start enrolling in courses immediately</li>
              </ol>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setStep("method")}>
                Import More Providers
              </Button>
              <Button className="bg-[#1a4d4d] hover:bg-[#0d3333]">
                View Provider Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-l-4 border-blue-500">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Onboarding Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-900">
          <div>
            <strong>Bulk Import (Recommended):</strong> Import all providers at once for 80-90% activation rate within 48 hours.
          </div>
          <div>
            <strong>SSO Integration:</strong> For enterprises, SSO auto-syncs your directory and eliminates manual work entirely.
          </div>
          <div>
            <strong>Activation Tracking:</strong> Monitor provider activation in your institution dashboard. Send reminders after 3 days.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
