import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Award,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  FileText,
  Shield,
} from "lucide-react";

export default function AccreditationDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  // Mock data - replace with real data from tRPC
  const facilityData = {
    name: "Kenyatta National Hospital",
    location: "Nairobi, Kenya",
    county: "Nairobi",
    status: "accredited",
    pCOSCARate: 78.5,
    totalEventsReported: 156,
    systemGapRemediationSpeed: 14, // days
    staffEngagementScore: 85,
    overallScore: 82,
    accreditationDate: "2024-06-15",
    expiryDate: "2026-06-15",
  };

  const accreditedFacilities = [
    {
      id: 1,
      name: "Kenyatta National Hospital",
      location: "Nairobi",
      pCOSCARate: 78.5,
      accreditationDate: "2024-06-15",
      badge: "Gold",
    },
    {
      id: 2,
      name: "Aga Khan University Hospital",
      location: "Nairobi",
      pCOSCARate: 82.3,
      accreditationDate: "2024-05-20",
      badge: "Gold",
    },
    {
      id: 3,
      name: "Mombasa Hospital",
      location: "Mombasa",
      pCOSCARate: 71.2,
      accreditationDate: "2024-07-10",
      badge: "Silver",
    },
    {
      id: 4,
      name: "Kisii Teaching Hospital",
      location: "Kisii",
      pCOSCARate: 65.8,
      accreditationDate: "2024-08-01",
      badge: "Bronze",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Paeds Resus Accreditation Program</h1>
          </div>
          <p className="text-lg text-blue-100 max-w-2xl">
            Recognize and celebrate healthcare facilities committed to achieving neurologically intact survival (pCOSCA) for all children.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="criteria">Criteria</TabsTrigger>
            <TabsTrigger value="directory">Directory</TabsTrigger>
            <TabsTrigger value="apply">Apply</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Facility Status Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    pCOSCA Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {facilityData.pCOSCARate}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Neurologically intact survival</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Events Reported
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {facilityData.totalEventsReported}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Safe-Truth events logged</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Staff Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {facilityData.staffEngagementScore}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Participation rate</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Overall Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {facilityData.overallScore}/100
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Accreditation score</p>
                </CardContent>
              </Card>
            </div>

            {/* Facility Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {facilityData.name}
                </CardTitle>
                <CardDescription>
                  {facilityData.location}, {facilityData.county}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Accreditation Status</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-sm">
                          <strong>Status:</strong> Accredited
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm">
                          <strong>Badge:</strong> Gold
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <span className="text-sm">
                          <strong>Accredited:</strong> {facilityData.accreditationDate}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                        <span className="text-sm">
                          <strong>Expires:</strong> {facilityData.expiryDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Performance Metrics</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>pCOSCA Rate</span>
                          <span className="font-semibold">{facilityData.pCOSCARate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${facilityData.pCOSCARate}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Staff Engagement</span>
                          <span className="font-semibold">{facilityData.staffEngagementScore}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${facilityData.staffEngagementScore}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Gap Remediation Speed</span>
                          <span className="font-semibold">
                            {facilityData.systemGapRemediationSpeed} days
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Average time to address gaps</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Criteria Tab */}
          <TabsContent value="criteria" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Accreditation Criteria</CardTitle>
                <CardDescription>
                  Facilities must meet these standards to achieve Paeds Resus accreditation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Bronze */}
                  <div className="border-2 border-orange-200 rounded-lg p-6 bg-orange-50">
                    <div className="flex items-center gap-2 mb-4">
                      <Award className="w-6 h-6 text-orange-600" />
                      <h3 className="font-bold text-lg">Bronze</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-semibold text-gray-900">pCOSCA Rate</p>
                        <p className="text-gray-600">≥ 60%</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Events Reported</p>
                        <p className="text-gray-600">≥ 50 per year</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Gap Remediation</p>
                        <p className="text-gray-600">≤ 30 days average</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Staff Engagement</p>
                        <p className="text-gray-600">≥ 60%</p>
                      </div>
                    </div>
                  </div>

                  {/* Silver */}
                  <div className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50">
                    <div className="flex items-center gap-2 mb-4">
                      <Award className="w-6 h-6 text-gray-400" />
                      <h3 className="font-bold text-lg">Silver</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-semibold text-gray-900">pCOSCA Rate</p>
                        <p className="text-gray-600">≥ 75%</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Events Reported</p>
                        <p className="text-gray-600">≥ 100 per year</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Gap Remediation</p>
                        <p className="text-gray-600">≤ 21 days average</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Staff Engagement</p>
                        <p className="text-gray-600">≥ 75%</p>
                      </div>
                    </div>
                  </div>

                  {/* Gold */}
                  <div className="border-2 border-yellow-400 rounded-lg p-6 bg-yellow-50">
                    <div className="flex items-center gap-2 mb-4">
                      <Award className="w-6 h-6 text-yellow-600" />
                      <h3 className="font-bold text-lg">Gold</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-semibold text-gray-900">pCOSCA Rate</p>
                        <p className="text-gray-600">≥ 85%</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Events Reported</p>
                        <p className="text-gray-600">≥ 150 per year</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Gap Remediation</p>
                        <p className="text-gray-600">≤ 14 days average</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Staff Engagement</p>
                        <p className="text-gray-600">≥ 85%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Directory Tab */}
          <TabsContent value="directory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Accredited Facilities Directory</CardTitle>
                <CardDescription>
                  Recognized healthcare facilities committed to excellence in pediatric emergency care
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accreditedFacilities.map((facility) => (
                    <div
                      key={facility.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{facility.name}</h3>
                        <p className="text-sm text-gray-600">{facility.location}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {facility.pCOSCARate}% pCOSCA
                          </p>
                          <p className="text-xs text-gray-500">
                            Accredited {facility.accreditationDate}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            facility.badge === "Gold"
                              ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                              : facility.badge === "Silver"
                                ? "bg-gray-100 text-gray-800 border-gray-300"
                                : "bg-orange-100 text-orange-800 border-orange-300"
                          }
                        >
                          {facility.badge}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Apply Tab */}
          <TabsContent value="apply" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Apply for Accreditation
                </CardTitle>
                <CardDescription>
                  Submit your facility for Paeds Resus accreditation review
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!showApplicationForm ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-2">
                        Why Apply for Accreditation?
                      </h3>
                      <ul className="space-y-2 text-sm text-blue-800">
                        <li>✓ Demonstrate commitment to quality pediatric emergency care</li>
                        <li>✓ Improve your facility's reputation and patient trust</li>
                        <li>✓ Access to Paeds Resus quality improvement resources</li>
                        <li>✓ Competitive advantage in healthcare market</li>
                        <li>✓ Potential reimbursement benefits from insurance partners</li>
                      </ul>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-semibold text-green-900 mb-2">
                        Application Requirements
                      </h3>
                      <ul className="space-y-2 text-sm text-green-800">
                        <li>✓ Minimum 50 Safe-Truth events reported in past 12 months</li>
                        <li>✓ Facility leadership commitment to quality improvement</li>
                        <li>✓ Staff trained in pediatric resuscitation (BLS/ACLS/PALS)</li>
                        <li>✓ Documented protocols for pediatric emergencies</li>
                        <li>✓ Willingness to participate in ongoing data collection</li>
                      </ul>
                    </div>

                    <Button
                      onClick={() => setShowApplicationForm(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Start Application
                    </Button>
                  </div>
                ) : (
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Facility Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter facility name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location/County
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter location"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Name of facility representative"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contact email"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+254..."
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowApplicationForm(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                        Submit Application
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
