import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, Heart } from "lucide-react";

export default function ROICalculator() {
  const [staffCount, setStaffCount] = useState(50);
  const [trainingCost, setTrainingCost] = useState(1250000);
  const [currentMortalityRate, setCurrentMortalityRate] = useState(5);
  const [expectedReduction, setExpectedReduction] = useState(23);
  const [patientsPerMonth, setPatientsPerMonth] = useState(200);
  const [costPerLife, setCostPerLife] = useState(500000);

  const currentDeaths = (patientsPerMonth * currentMortalityRate) / 100;
  const newMortalityRate = currentMortalityRate - (currentMortalityRate * expectedReduction) / 100;
  const newDeaths = (patientsPerMonth * newMortalityRate) / 100;
  const livesPerMonth = currentDeaths - newDeaths;
  const livesPerYear = livesPerMonth * 12;
  const valuePerYear = livesPerYear * costPerLife;
  const roi = ((valuePerYear - trainingCost) / trainingCost) * 100;
  const paybackMonths = trainingCost / (valuePerYear / 12);

  const projectionData = Array.from({ length: 61 }, (_, i) => {
    const month = i;
    const year = Math.floor(month / 12);
    const cumulativeCost = trainingCost + month * 5000;
    const cumulativeBenefit = valuePerYear * year + ((valuePerYear / 12) * (month % 12));
    return {
      month: `Y${year}M${month % 12}`,
      cost: cumulativeCost,
      benefit: cumulativeBenefit,
      net: cumulativeBenefit - cumulativeCost,
    };
  });

  const impactData = [
    {
      metric: "Current Monthly Deaths",
      value: currentDeaths.toFixed(1),
      unit: "children",
    },
    {
      metric: "New Monthly Deaths",
      value: newDeaths.toFixed(1),
      unit: "children",
    },
    {
      metric: "Lives Saved Per Year",
      value: livesPerYear.toFixed(0),
      unit: "children",
    },
    {
      metric: "Annual Value Created",
      value: (valuePerYear / 1000000).toFixed(2),
      unit: "million KES",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
            ROI Analysis
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            ROI Calculator
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Calculate the return on investment from training your staff
          </p>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Training Investment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="staff">Number of Staff Trained</Label>
                  <Input
                    id="staff"
                    type="number"
                    value={staffCount}
                    onChange={(e) => setStaffCount(parseInt(e.target.value))}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="cost">Total Training Cost (KES)</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={trainingCost}
                    onChange={(e) => setTrainingCost(parseInt(e.target.value))}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="mortality">Current Pediatric Mortality Rate (%)</Label>
                  <Input
                    id="mortality"
                    type="number"
                    value={currentMortalityRate}
                    onChange={(e) => setCurrentMortalityRate(parseFloat(e.target.value))}
                    step="0.1"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="patients">Pediatric Patients Per Month</Label>
                  <Input
                    id="patients"
                    type="number"
                    value={patientsPerMonth}
                    onChange={(e) => setPatientsPerMonth(parseInt(e.target.value))}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expected Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="reduction">Expected Mortality Reduction (%)</Label>
                  <Input
                    id="reduction"
                    type="number"
                    value={expectedReduction}
                    onChange={(e) => setExpectedReduction(parseFloat(e.target.value))}
                    step="0.1"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Based on Paeds Resus data: average 23% reduction
                  </p>
                </div>
                <div>
                  <Label htmlFor="cost-per-life">Cost Per Life Saved (KES)</Label>
                  <Input
                    id="cost-per-life"
                    type="number"
                    value={costPerLife}
                    onChange={(e) => setCostPerLife(parseInt(e.target.value))}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Economic value of a life saved (WHO standard)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1">
            <Card className="sticky top-4 border-2 border-blue-600 bg-blue-50">
              <CardHeader>
                <CardTitle>ROI Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-white p-4 rounded border border-blue-200">
                  <p className="text-xs text-gray-600 mb-1">Annual ROI</p>
                  <p className="text-3xl font-bold text-blue-600">{roi.toFixed(0)}%</p>
                </div>

                <div className="bg-white p-4 rounded border border-green-200">
                  <p className="text-xs text-gray-600 mb-1">Payback Period</p>
                  <p className="text-3xl font-bold text-green-600">
                    {paybackMonths.toFixed(1)} months
                  </p>
                </div>

                <div className="bg-white p-4 rounded border border-purple-200">
                  <p className="text-xs text-gray-600 mb-1">Annual Value Created</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {(valuePerYear / 1000000).toFixed(2)}M KES
                  </p>
                </div>

                <div className="bg-white p-4 rounded border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-5 h-5 text-red-600" />
                    <p className="text-xs text-gray-600">Lives Saved Per Year</p>
                  </div>
                  <p className="text-3xl font-bold text-red-600">
                    {livesPerYear.toFixed(0)}
                  </p>
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Get Detailed Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">Impact Metrics</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {impactData.map((item, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-600 mb-2">{item.metric}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {item.value}
                  </p>
                  <p className="text-xs text-gray-500">{item.unit}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>5-Year ROI Projection</CardTitle>
              <CardDescription>
                Cumulative costs vs. benefits over 5 years
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => `${(value / 1000000).toFixed(2)}M KES`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    stroke="#ef4444"
                    name="Cumulative Cost"
                  />
                  <Line
                    type="monotone"
                    dataKey="benefit"
                    stroke="#10b981"
                    name="Cumulative Benefit"
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    stroke="#3b82f6"
                    name="Net Benefit"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">Key Insights</h2>
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <TrendingUp className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Strong Positive ROI
                    </h3>
                    <p className="text-gray-700">
                      With an ROI of {roi.toFixed(0)}%, your investment will pay for itself
                      in {paybackMonths.toFixed(1)} months and continue generating value.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Heart className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Lives Saved
                    </h3>
                    <p className="text-gray-700">
                      Beyond financial returns, your training will save approximately
                      {livesPerYear.toFixed(0)} children lives per year.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <DollarSign className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Annual Value
                    </h3>
                    <p className="text-gray-700">
                      Your institution will create {(valuePerYear / 1000000).toFixed(2)}M KES
                      in value annually through improved patient outcomes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
