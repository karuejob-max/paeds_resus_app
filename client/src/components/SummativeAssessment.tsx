/**
 * Summative Assessment Component
 * 
 * Displays final exams and capstone projects for course completion
 * Features:
 * - Final exam with comprehensive questions
 * - Capstone project with clinical cases
 * - Scoring rubric display
 * - Detailed feedback and grading
 * - Certification eligibility check
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle2, XCircle, AlertCircle, Award, FileText } from 'lucide-react';
import type { CapstoneProject, ClinicalCase, ScoringRubric } from '@/lib/courseContent';

interface SummativeAssessmentProps {
  courseTitle: string;
  finalExamScore?: number;
  capstoneScore?: number;
  onSubmitFinalExam?: (answers: Record<number, string>) => void;
  onSubmitCapstone?: (caseId: string, answer: string) => void;
  capstoneProject: CapstoneProject;
}

interface CapstoneCaseResponse {
  caseId: string;
  answer: string;
  score?: number;
  feedback?: string;
}

export function SummativeAssessment({
  courseTitle,
  finalExamScore,
  capstoneScore,
  onSubmitFinalExam,
  onSubmitCapstone,
  capstoneProject,
}: SummativeAssessmentProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [caseResponses, setCaseResponses] = useState<Record<string, CapstoneCaseResponse>>({});
  const [selectedCase, setSelectedCase] = useState<ClinicalCase | null>(capstoneProject.cases[0] || null);

  const handleCaseAnswer = (caseId: string, answer: string) => {
    setCaseResponses((prev) => ({
      ...prev,
      [caseId]: {
        caseId,
        answer,
      },
    }));
  };

  const handleSubmitCase = (caseId: string) => {
    const response = caseResponses[caseId];
    if (response && onSubmitCapstone) {
      onSubmitCapstone(caseId, response.answer);
    }
  };

  const isExamPassed = finalExamScore && finalExamScore >= 80;
  const isCapstoneCompleted = capstoneScore !== undefined;
  const isCertified = isExamPassed && isCapstoneCompleted && capstoneScore! >= 80;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="exam">Final Exam</TabsTrigger>
          <TabsTrigger value="capstone">Capstone Project</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-6 w-6 text-blue-600" />
                Course Completion Status
              </CardTitle>
              <CardDescription>{courseTitle}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Certification Status */}
              {isCertified ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Congratulations! You have met all requirements for certification.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    Complete both the final exam and capstone project to earn certification.
                  </AlertDescription>
                </Alert>
              )}

              {/* Requirements */}
              <div className="space-y-4">
                <h3 className="font-semibold">Requirements</h3>

                {/* Final Exam */}
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isExamPassed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : finalExamScore !== undefined ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-slate-400" />
                      )}
                      <span className="font-medium">Final Exam (80% required)</span>
                    </div>
                    {finalExamScore !== undefined && (
                      <Badge variant={isExamPassed ? 'default' : 'destructive'}>
                        {finalExamScore}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">
                    Comprehensive exam covering all course modules
                  </p>
                </div>

                {/* Capstone Project */}
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isCapstoneCompleted && capstoneScore! >= 80 ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : isCapstoneCompleted ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-slate-400" />
                      )}
                      <span className="font-medium">Capstone Project (80% required)</span>
                    </div>
                    {capstoneScore !== undefined && (
                      <Badge variant={capstoneScore >= 80 ? 'default' : 'destructive'}>
                        {capstoneScore}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">
                    Clinical case analysis demonstrating mastery
                  </p>
                </div>
              </div>

              {/* Overall Progress */}
              <div>
                <h3 className="font-semibold mb-2">Overall Progress</h3>
                <Progress
                  value={
                    ((isExamPassed ? 50 : finalExamScore ? 25 : 0) +
                      (isCapstoneCompleted && capstoneScore! >= 80 ? 50 : capstoneScore ? 25 : 0)) /
                    100
                  }
                  className="h-3"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Final Exam Tab */}
        <TabsContent value="exam" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Final Exam</CardTitle>
              <CardDescription>
                {finalExamScore !== undefined
                  ? `Your Score: ${finalExamScore}%`
                  : 'Comprehensive assessment of all course material'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {finalExamScore !== undefined ? (
                <div className="text-center space-y-4">
                  <div className="text-5xl font-bold">{finalExamScore}%</div>
                  <div className="flex justify-center">
                    {isExamPassed ? (
                      <CheckCircle2 className="h-12 w-12 text-green-600" />
                    ) : (
                      <XCircle className="h-12 w-12 text-red-600" />
                    )}
                  </div>
                  <p className="text-lg font-medium">
                    {isExamPassed ? 'Exam Passed!' : 'Exam Not Passed'}
                  </p>
                  <p className="text-sm text-slate-600">
                    Passing score: 80% | Your score: {finalExamScore}%
                  </p>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Final exam not yet available. Complete all course modules first.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Capstone Project Tab */}
        <TabsContent value="capstone" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {capstoneProject.title}
              </CardTitle>
              <CardDescription>{capstoneProject.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Case Selection */}
              <div>
                <h3 className="font-semibold mb-3">Clinical Cases</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {capstoneProject.cases.map((caseItem) => (
                    <button
                      key={caseItem.id}
                      onClick={() => setSelectedCase(caseItem)}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        selectedCase?.id === caseItem.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-medium text-sm">{caseItem.title}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {caseItem.patientAge}y, {caseItem.patientWeight}kg
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Case */}
              {selectedCase && (
                <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold mb-2">{selectedCase.title}</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Scenario:</span>
                        <p className="text-slate-700">{selectedCase.scenario}</p>
                      </div>
                      <div>
                        <span className="font-medium">Patient:</span>
                        <p className="text-slate-700">
                          {selectedCase.patientAge} years old, {selectedCase.patientWeight} kg
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Presenting Complaint:</span>
                        <p className="text-slate-700">{selectedCase.presentingComplaint}</p>
                      </div>
                      <div>
                        <span className="font-medium">Clinical Findings:</span>
                        <p className="text-slate-700">{selectedCase.clinicalFindings}</p>
                      </div>
                      <div>
                        <span className="font-medium">Investigations:</span>
                        <p className="text-slate-700">{selectedCase.investigations}</p>
                      </div>
                      <div>
                        <span className="font-medium">Initial Management:</span>
                        <p className="text-slate-700">{selectedCase.initialManagement}</p>
                      </div>
                    </div>
                  </div>

                  {/* Question */}
                  <div className="border-t pt-4">
                    <p className="font-medium mb-3">{selectedCase.questionPrompt}</p>
                    <Textarea
                      placeholder="Type your response here..."
                      value={caseResponses[selectedCase.id]?.answer || ''}
                      onChange={(e) => handleCaseAnswer(selectedCase.id, e.target.value)}
                      className="min-h-32"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={() => handleSubmitCase(selectedCase.id)}
                    disabled={!caseResponses[selectedCase.id]?.answer}
                    className="w-full"
                  >
                    Submit Case Response
                  </Button>
                </div>
              )}

              {/* Scoring Rubric */}
              <div className="space-y-3">
                <h3 className="font-semibold">Scoring Rubric</h3>
                {capstoneProject.rubric.criteria.map((criterion, idx) => (
                  <div key={idx} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{criterion.name}</span>
                      <Badge variant="outline">{criterion.points} pts</Badge>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{criterion.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-green-50 rounded border border-green-200">
                        <p className="font-medium text-green-900">Excellent</p>
                        <p className="text-green-800">{criterion.levels.excellent}</p>
                      </div>
                      <div className="p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="font-medium text-blue-900">Good</p>
                        <p className="text-blue-800">{criterion.levels.good}</p>
                      </div>
                      <div className="p-2 bg-amber-50 rounded border border-amber-200">
                        <p className="font-medium text-amber-900">Satisfactory</p>
                        <p className="text-amber-800">{criterion.levels.satisfactory}</p>
                      </div>
                      <div className="p-2 bg-red-50 rounded border border-red-200">
                        <p className="font-medium text-red-900">Needs Improvement</p>
                        <p className="text-red-800">{criterion.levels.needsImprovement}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-slate-600">
                  Total Points: {capstoneProject.rubric.totalPoints} | Passing Score:{' '}
                  {capstoneProject.rubric.passingScore}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
