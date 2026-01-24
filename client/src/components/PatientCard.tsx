import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PatientCardProps {
  id: number;
  name: string;
  age?: number;
  gender?: string;
  diagnosis?: string;
  riskScore: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  confidence: number;
  timeToDeterioration: number;
  onViewDetails?: () => void;
  onLogIntervention?: () => void;
}

export function PatientCard({
  id,
  name,
  age,
  gender,
  diagnosis,
  riskScore,
  severity,
  confidence,
  timeToDeterioration,
  onViewDetails,
  onLogIntervention,
}: PatientCardProps) {
  const severityColor = {
    CRITICAL: "bg-red-100 text-red-800 border-red-300",
    HIGH: "bg-orange-100 text-orange-800 border-orange-300",
    MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-300",
  };

  const riskBarColor =
    riskScore > 70 ? "bg-red-500" : riskScore > 50 ? "bg-orange-500" : "bg-yellow-500";

  return (
    <Card className={`border-2 ${severityColor[severity]}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{name}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {age && `${age} years old`} {gender && `• ${gender}`}
            </p>
          </div>
          <Badge className={`${severityColor[severity]} border`}>{severity}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {diagnosis && (
          <div>
            <p className="text-sm font-medium">Diagnosis</p>
            <p className="text-sm text-gray-700">{diagnosis}</p>
          </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium">Risk Score</p>
            <span className="text-lg font-bold">{riskScore}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`${riskBarColor} h-2 rounded-full`} style={{ width: `${riskScore}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Confidence</p>
            <p className="font-semibold">{(confidence * 100).toFixed(0)}%</p>
          </div>
          <div>
            <p className="text-gray-600">Time to Deterioration</p>
            <p className="font-semibold">{timeToDeterioration} hours</p>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" size="sm" onClick={onViewDetails} className="flex-1">
            View Details
          </Button>
          <Button size="sm" onClick={onLogIntervention} className="flex-1">
            Log Intervention
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
