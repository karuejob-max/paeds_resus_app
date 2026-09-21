export type CpdQuizQuestion = {
  id: number;
  questionType: "multiple_choice" | "true_false";
  correctAnswer: string;
};

export type CpdQuizAnswer = string | number;

function normalizeAnswer(value: CpdQuizAnswer | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

export function scoreCpdQuiz(
  questions: readonly CpdQuizQuestion[],
  answers: Record<string, CpdQuizAnswer>,
  passingScore: number,
) {
  const correctCount = questions.reduce((count, question) => {
    const answer = answers[String(question.id)];
    return count + (normalizeAnswer(answer) === normalizeAnswer(question.correctAnswer) ? 1 : 0);
  }, 0);
  const score = questions.length === 0 ? 0 : Math.round((correctCount / questions.length) * 100);
  return {
    correctCount,
    totalQuestions: questions.length,
    score,
    passingScore,
    passed: questions.length > 0 && score >= passingScore,
  };
}

export function bestCpdQuizAttemptPassed(
  attempts: readonly { score: number; passed: boolean }[],
  passingScore: number,
) {
  return attempts.some(attempt => attempt.passed && attempt.score >= passingScore);
}
