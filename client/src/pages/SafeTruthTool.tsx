import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, Shield, TrendingUp } from "lucide-react";

export default function SafeTruthTool() {
  const [activeTab, setActiveTab] = useState<"overview" | "assessment" | "results">("overview");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const assessmentQuestions = [
    {
      id: 1,
      category: "Safety Culture",
      question: "How often do you report near-miss incidents?",
      options: [
        { value: "never", label: "Never", score: 0 },
        { value: "rarely", label: "Rarely", score: 1 },
        { value: "sometimes", label: "Sometimes", score: 2 },
        { value: "often", label: "Often", score: 3 },
        { value: "always", label: "Always", score: 4 },
      ],
    },
    {
      id: 2,
      category: "Safety Culture",
      question: "Do you feel comfortable speaking up about safety concerns?",
      options: [
        { value: "very_uncomfortable", label: "Very Uncomfortable", score: 0 },
        { value: "uncomfortable", label: "Uncomfortable", score: 1 },
        { value: "neutral", label: "Neutral", score: 2 },
        { value: "comfortable", label: "Comfortable", score: 3 },
        { value: "very_comfortable", label: "Very Comfortable", score: 4 },
      ],
    },
    {
      id: 3,
      category: "Communication",
      question: "How often are safety briefings conducted before procedures?",
      options: [
        { value: "never", label: "Never", score: 0 },
        { value: "rarely", label: "Rarely", score: 1 },
        { value: "sometimes", label: "Sometimes", score: 2 },
        { value: "often", label: "Often", score: 3 },
        { value: "always", label: "Always", score: 4 },
      ],
    },
    {
      id: 4,
      category: "Communication",
      question: "How effective is communication between team members during emergencies?",
      options: [
        { value: "very_poor", label: "Very Poor", score: 0 },
        { value: "poor", label: "Poor", score: 1 },
        { value: "fair", label: "Fair", score: 2 },
        { value: "good", label: "Good", score: 3 },
        { value: "excellent", label: "Excellent", score: 4 },
      ],
    },
    {
      id: 5,
      category: "Equipment & Resources",
      question: "Are safety-critical equipment and medications always available?",
      options: [
        { value: "never", label: "Never", score: 0 },
        { value: "rarely", label: "Rarely", score: 1 },
        { value: "sometimes", label: "Sometimes", score: 2 },
        { value: "often", label: "Often", score: 3 },
        { value: "always", label: "Always", score: 4 },
      ],
    },
    {
      id: 6,
      category: "Leadership",
      question: "Does leadership prioritize safety over productivity?",
      options: [
        { value: "never", label: "Never", score: 0 },
        { value: "rarely", label: "Rarely", score: 1 },
        { value: "sometimes", label: "Sometimes", score: 2 },
        { value: "often", label: "Often", score: 3 },
        { value: "always", label: "Always", score: 4 },
      ],
    },
    {
      id: 7,
      category: "Learning Culture",
      question: "Are incidents used as learning opportunities rather than blame?",
      options: [
        { value: "never", label: "Never", score: 0 },
        { value: "rarely", label: "Rarely", score: 1 },
        { value: "sometimes", label: "Sometimes", score: 2 },
        { value: "often", label: "Often", score: 3 },
        { value: "always", label: "Always", score: 4 },
      ],
    },
    {
      id: 8,
      category: "Learning Culture",
      question: "How often do you receive feedback on your safety performance?",
      options: [
        { value: "never", label: "Never", score: 0 },
        { value: "rarely", label: "Rarely", score: 1 },
        { value: "sometimes", label: "Sometimes", score: 2 },
        { value: "often", label: "Often", score: 3 },
        { value: "always", label: "Always", score: 4 },
      ],
    },
  ];

  const handleAnswer = (questionId: number, value: string, score: number) => {
    setAnswers({ ...answers, [questionId]: value });
    const category = assessmentQuestions[currentQuestion].category;
    setScores({
      ...scores,
      [category]: (scores[category] || 0) + score,
    });
  };

  const handleNext = () => {
    if (currentQuestion < assessmentQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setActiveTab("results");
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateResults = () => {
    const categories = ["Safety Culture", "Communication", "Equipment & Resources", "Leadership", "Learning Culture"];
    const results = categories.map((cat) => {
      const maxScore = assessmentQuestions.filter((q) => q.category === cat).length * 4;
      const score = scores[cat] || 0;
      const percentage = Math.round((score / maxScore) * 100);
      return { category: cat, score, maxScore, percentage };
    });
    return results;
  };

  const results = calculateResults();
  const overallScore = Math.round(
    results.reduce((sum, r) => sum + r.percentage, 0) / results.length
  );

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: "Excellent", color: "text-green-600", bg: "bg-green-50" };
    if (score >= 60) return { level: "Good", color: "text-blue-600", bg: "bg-blue-50" };
    if (score >= 40) return { level: "Fair", color: "text-yellow-600", bg: "bg-yellow-50" };
    return { level: "Needs Improvement", color: "text-red-600", bg: "bg-red-50" };
  };

  const riskLevel = getRiskLevel(overallScore);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
            Safety Assessment Tool
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Safe-Truth Assessment Tool
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Evaluate your institution's safety culture and identify areas for improvement
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-4 mb-8 border-b">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-4 font-semibold transition-colors ${
                activeTab === "overview"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("assessment")}
              className={`pb-4 font-semibold transition-colors ${
                activeTab === "assessment"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Assessment
            </button>
            <button
              onClick={() => setActiveTab("results")}
              className={`pb-4 font-semibold transition-colors ${
                activeTab === "results"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              disabled={Object.keys(answers).length === 0}
            >
              Results
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-6 h-6 text-blue-600" />
                    What is Safe-Truth?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Safe-Truth is a comprehensive assessment tool designed to evaluate the safety culture of your
                    institution. It measures key dimensions of organizational safety and provides actionable insights
                    for improvement.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border-l-4 border-blue-600 pl-4">
                      <h4 className="font-semibold mb-2">Safety Culture</h4>
                      <p className="text-sm text-gray-600">
                        How well your team reports and addresses safety concerns
                      </p>
                    </div>
                    <div className="border-l-4 border-green-600 pl-4">
                      <h4 className="font-semibold mb-2">Communication</h4>
                      <p className="text-sm text-gray-600">
                        Effectiveness of team communication during critical moments
                      </p>
                    </div>
                    <div className="border-l-4 border-purple-600 pl-4">
                      <h4 className="font-semibold mb-2">Resources</h4>
                      <p className="text-sm text-gray-600">
                        Availability of equipment and critical medications
                      </p>
                    </div>
                    <div className="border-l-4 border-orange-600 pl-4">
                      <h4 className="font-semibold mb-2">Leadership</h4>
                      <p className="text-sm text-gray-600">
                        Leadership commitment to safety over productivity
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4">
                    <li className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold">Complete the Assessment</h4>
                        <p className="text-sm text-gray-600">
                          Answer 8 questions about your institution's safety culture
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold">Get Your Score</h4>
                        <p className="text-sm text-gray-600">
                          Receive a detailed assessment of your safety culture
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold">Get Recommendations</h4>
                        <p className="text-sm text-gray-600">
                          Receive actionable recommendations for improvement
                        </p>
                      </div>
                    </li>
                  </ol>
                </CardContent>
              </Card>

              <Button size="lg" className="w-full" onClick={() => setActiveTab("assessment")}>
                Start Assessment
              </Button>
            </div>
          )}

          {/* Assessment Tab */}
          {activeTab === "assessment" && (
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">
                    Question {currentQuestion + 1} of {assessmentQuestions.length}
                  </h3>
                  <Badge variant="outline">{assessmentQuestions[currentQuestion].category}</Badge>
                </div>
                <Progress value={((currentQuestion + 1) / assessmentQuestions.length) * 100} className="h-2" />
              </div>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-6">{assessmentQuestions[currentQuestion].question}</h3>

                  <RadioGroup
                    value={answers[assessmentQuestions[currentQuestion].id] || ""}
                    onValueChange={(value) => {
                      const option = assessmentQuestions[currentQuestion].options.find(
                        (o) => o.value === value
                      );
                      if (option) {
                        handleAnswer(assessmentQuestions[currentQuestion].id, value, option.score);
                      }
                    }}
                  >
                    <div className="space-y-4">
                      {assessmentQuestions[currentQuestion].options.map((option) => (
                        <div key={option.value} className="flex items-center space-x-3">
                          <RadioGroupItem value={option.value} id={option.value} />
                          <Label htmlFor={option.value} className="cursor-pointer flex-1">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  className="flex-1"
                >
                  Previous
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!answers[assessmentQuestions[currentQuestion].id]}
                  className="flex-1"
                >
                  {currentQuestion === assessmentQuestions.length - 1 ? "View Results" : "Next"}
                </Button>
              </div>
            </div>
          )}

          {/* Results Tab */}
          {activeTab === "results" && (
            <div className="space-y-8">
              <Card className={`border-2 ${riskLevel.bg}`}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className={`text-5xl font-bold ${riskLevel.color} mb-4`}>{overallScore}%</div>
                    <h3 className={`text-2xl font-semibold ${riskLevel.color} mb-2`}>{riskLevel.level}</h3>
                    <p className="text-gray-600">Overall Safety Culture Score</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Category Breakdown</h3>
                {results.map((result) => (
                  <Card key={result.category}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold">{result.category}</h4>
                        <span className="text-lg font-bold text-blue-600">{result.percentage}%</span>
                      </div>
                      <Progress value={result.percentage} className="h-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {overallScore < 60 && (
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-600">Urgent: Safety Culture Improvement Needed</h4>
                        <p className="text-sm text-gray-700">
                          Your institution's safety culture requires immediate attention. Consider implementing
                          comprehensive safety training and leadership engagement programs.
                        </p>
                      </div>
                    </div>
                  )}
                  {overallScore >= 60 && overallScore < 80 && (
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-yellow-600">Moderate: Focus on Weak Areas</h4>
                        <p className="text-sm text-gray-700">
                          Your safety culture is developing well. Focus on strengthening the categories with lower
                          scores through targeted interventions.
                        </p>
                      </div>
                    </div>
                  )}
                  {overallScore >= 80 && (
                    <div className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-green-600">Excellent: Maintain and Enhance</h4>
                        <p className="text-sm text-gray-700">
                          Your institution has a strong safety culture. Continue to maintain these standards and
                          consider becoming a safety leader in your region.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentQuestion(0);
                    setAnswers({});
                    setScores({});
                    setActiveTab("assessment");
                  }}
                  className="flex-1"
                >
                  Retake Assessment
                </Button>
                <Button className="flex-1">Download Report</Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
