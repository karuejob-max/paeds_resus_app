/**
 * Module Quiz Component
 * 
 * Displays formative assessment quiz for each course module
 * Features:
 * - Multiple choice, true/false, short answer questions
 * - Real-time scoring
 * - Progress tracking
 * - Immediate feedback with explanations
 * - Retry capability with score history
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, XCircle, AlertCircle, ChevronRight, RotateCcw } from 'lucide-react';
import type { ModuleQuiz, QuizQuestion } from '@/lib/courseContent';

interface ModuleQuizProps {
  quiz: ModuleQuiz;
  onComplete: (score: number, passed: boolean) => void;
  onSkip?: () => void;
}

interface QuizState {
  currentQuestionIndex: number;
  answers: Record<number, string>;
  submitted: boolean;
  score: number;
  passed: boolean;
  showFeedback: boolean;
}

export function ModuleQuiz({ quiz, onComplete, onSkip }: ModuleQuizProps) {
  const [state, setState] = useState<QuizState>({
    currentQuestionIndex: 0,
    answers: {},
    submitted: false,
    score: 0,
    passed: false,
    showFeedback: false,
  });

  const currentQuestion = quiz.questions[state.currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const answeredQuestions = Object.keys(state.answers).length;
  const progressPercent = (answeredQuestions / totalQuestions) * 100;

  const handleAnswer = (answer: string) => {
    setState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [state.currentQuestionIndex]: answer,
      },
    }));
  };

  const handleSubmitAnswer = () => {
    if (!state.answers[state.currentQuestionIndex]) {
      alert('Please select an answer');
      return;
    }

    if (state.currentQuestionIndex < totalQuestions - 1) {
      setState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }));
    } else {
      // Quiz complete, calculate score
      calculateScore();
    }
  };

  const calculateScore = () => {
    let correctCount = 0;
    let totalPoints = 0;

    quiz.questions.forEach((q, index) => {
      totalPoints += q.points;
      if (state.answers[index] === q.correctAnswer) {
        correctCount += q.points;
      }
    });

    const scorePercent = Math.round((correctCount / totalPoints) * 100);
    const passed = scorePercent >= quiz.passingScore;

    setState((prev) => ({
      ...prev,
      submitted: true,
      score: scorePercent,
      passed,
      showFeedback: true,
    }));
  };

  const handleRetry = () => {
    setState({
      currentQuestionIndex: 0,
      answers: {},
      submitted: false,
      score: 0,
      passed: false,
      showFeedback: false,
    });
  };

  const handleComplete = () => {
    onComplete(state.score, state.passed);
  };

  if (state.submitted) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {state.passed ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  Quiz Passed!
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-600" />
                  Quiz Not Passed
                </>
              )}
            </CardTitle>
            <CardDescription>
              You scored {state.score}% (passing score: {quiz.passingScore}%)
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Score Display */}
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">{state.score}%</div>
              <Progress value={state.score} className="h-3" />
            </div>

            {/* Review Answers */}
            <div className="space-y-4">
              <h3 className="font-semibold">Review Your Answers</h3>
              {quiz.questions.map((question, index) => {
                const userAnswer = state.answers[index];
                const isCorrect = userAnswer === question.correctAnswer;

                return (
                  <div
                    key={question.id}
                    className={`p-4 rounded-lg border-2 ${
                      isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-1" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">Question {index + 1}</p>
                        <p className="text-sm text-slate-700 mt-1">{question.text}</p>
                      </div>
                    </div>

                    <div className="ml-7 space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Your answer: </span>
                        <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                          {userAnswer}
                        </span>
                      </div>
                      {!isCorrect && (
                        <div>
                          <span className="font-medium">Correct answer: </span>
                          <span className="text-green-700">{question.correctAnswer}</span>
                        </div>
                      )}
                      <div className="mt-2 p-2 bg-white rounded border border-slate-200">
                        <p className="font-medium text-xs text-slate-600 mb-1">Explanation:</p>
                        <p className="text-slate-700">{question.explanation}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-center pt-4">
              {!state.passed && (
                <Button onClick={handleRetry} variant="outline" className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Retry Quiz
                </Button>
              )}
              <Button onClick={handleComplete} className="gap-2">
                {state.passed ? 'Continue to Next Module' : 'Review Content'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle>{quiz.title}</CardTitle>
              <CardDescription>
                Question {state.currentQuestionIndex + 1} of {totalQuestions}
              </CardDescription>
            </div>
            {quiz.timeLimit && (
              <Badge variant="outline">
                Time: {quiz.timeLimit} min
              </Badge>
            )}
          </div>
          <Progress value={progressPercent} className="h-2" />
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Question */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{currentQuestion.text}</h3>

            {/* Multiple Choice */}
            {currentQuestion.type === 'multiple-choice' && (
              <RadioGroup
                value={state.answers[state.currentQuestionIndex] || ''}
                onValueChange={handleAnswer}
              >
                <div className="space-y-3">
                  {currentQuestion.options?.map((option, idx) => (
                    <div key={idx} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-slate-50 cursor-pointer">
                      <RadioGroupItem value={option} id={`option-${idx}`} />
                      <label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {/* True/False */}
            {currentQuestion.type === 'true-false' && (
              <div className="space-y-3">
                {['True', 'False'].map((option) => (
                  <div
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      state.answers[state.currentQuestionIndex] === option
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={state.answers[state.currentQuestionIndex] === option}
                        onChange={() => {}}
                      />
                      <span className="font-medium">{option}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Short Answer */}
            {currentQuestion.type === 'short-answer' && (
              <Textarea
                placeholder="Type your answer here..."
                value={state.answers[state.currentQuestionIndex] || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                className="min-h-24"
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 justify-between pt-4">
            <Button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  currentQuestionIndex: Math.max(0, prev.currentQuestionIndex - 1),
                }))
              }
              variant="outline"
              disabled={state.currentQuestionIndex === 0}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              {onSkip && (
                <Button onClick={onSkip} variant="ghost">
                  Skip Quiz
                </Button>
              )}
              <Button
                onClick={handleSubmitAnswer}
                disabled={!state.answers[state.currentQuestionIndex]}
              >
                {state.currentQuestionIndex === totalQuestions - 1 ? 'Submit Quiz' : 'Next Question'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
