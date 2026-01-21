import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Shield, TrendingUp, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import SafeTruthLogger from "@/components/SafeTruthLogger";

export default function SafeTruth() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f9f9] to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#1a4d4d] to-[#0d3333] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Safe-Truth Platform</h1>
          </div>
          <p className="text-lg text-blue-100 max-w-2xl mb-6">
            A confidential space for healthcare providers to report pediatric emergency events, identify system gaps, and drive continuous improvement in care quality.
          </p>
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <Shield className="w-3 h-3 mr-1" /> Confidential Reporting
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <TrendingUp className="w-3 h-3 mr-1" /> Data-Driven Insights
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <Heart className="w-3 h-3 mr-1" /> Neurologically Intact Survival
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Why Safe-Truth Matters */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Identify Gaps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Report system gaps without fear—knowledge, resources, leadership, communication, or infrastructure barriers that impact care.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Get Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Receive personalized, role-specific recommendations to improve your practice and your facility's care quality.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Drive Change
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Contribute to a movement toward neurologically intact survival (pCOSCA) for all children, regardless of circumstances.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Event Logger */}
        <div className="mb-12">
          <SafeTruthLogger />
        </div>

        {/* How It Works */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>How Safe-Truth Works</CardTitle>
            <CardDescription>
              A 4-step process to capture, analyze, and improve pediatric emergency care
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white font-bold">
                    1
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Log the Event</h3>
                  <p className="text-gray-600 mt-1">
                    Report when and where a pediatric emergency occurred, the child's age, and initial presentation.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white font-bold">
                    2
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Track the Chain of Survival</h3>
                  <p className="text-gray-600 mt-1">
                    Check off each step of the chain of survival (Recognition, Activation, CPR, Defibrillation, Advanced Care, Post-Resuscitation).
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white font-bold">
                      3
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Identify System Gaps</h3>
                  <p className="text-gray-600 mt-1">
                    Select gaps you identified: knowledge, resources, leadership, communication, protocol, equipment, training, staffing, or infrastructure.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white font-bold">
                    4
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Receive Recommendations</h3>
                  <p className="text-gray-600 mt-1">
                    Get personalized insights and recommendations based on your role and the gaps identified. Track your progress over time.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Confidentiality */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Your Privacy is Protected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <p>
              ✓ <strong>Anonymous Reporting:</strong> You can report events anonymously if you prefer.
            </p>
            <p>
              ✓ <strong>Confidential Data:</strong> All reports are stored securely and used only for quality improvement.
            </p>
            <p>
              ✓ <strong>No Punishment:</strong> Safe-Truth is designed for learning and improvement, not blame or disciplinary action.
            </p>
            <p>
              ✓ <strong>Aggregated Insights:</strong> Facility-level data is anonymized and used to identify trends, not individual performance.
            </p>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Every event you log contributes to our understanding of how to improve pediatric emergency care and save more children's lives.
          </p>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            Start Logging Events
          </Button>
        </div>
      </div>
    </div>
  );
}
