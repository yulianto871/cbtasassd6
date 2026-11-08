import { Question, QuestionScoreDetail, ExamSubject } from '../types/cbt';

export interface ScoreSummary {
  score: number; // 0-100 normalized
  totalEarnedPoints: number;
  totalMaxPoints: number;
  percentage: number;
  isPassed: boolean;
  breakdown: Record<string, QuestionScoreDetail>;
}

export function gradeQuestion(question: Question, userAnswer: any): QuestionScoreDetail {
  const maxPoints = question.points || 10;
  let earnedPoints = 0;
  let isCorrect = false;
  let correctAnswerDisplay = '';

  switch (question.type) {
    case 'mc_single': {
      const correctOption = question.correctAnswerSingle || '';
      correctAnswerDisplay = `Opsi ${correctOption}`;
      if (userAnswer && String(userAnswer).trim().toUpperCase() === correctOption.toUpperCase()) {
        earnedPoints = maxPoints;
        isCorrect = true;
      }
      break;
    }

    case 'mc_mcma': {
      const correctKeys = (question.correctAnswerMcma || []).map((k) => k.toUpperCase()).sort();
      correctAnswerDisplay = correctKeys.join(', ');
      const userSelected = Array.isArray(userAnswer)
        ? (userAnswer as string[]).map((k) => String(k).toUpperCase()).sort()
        : [];

      // Calculate matches
      let correctCount = 0;
      userSelected.forEach((opt) => {
        if (correctKeys.includes(opt)) correctCount++;
      });

      // Deduction for wrong picks to prevent student checking everything
      let wrongCount = 0;
      userSelected.forEach((opt) => {
        if (!correctKeys.includes(opt)) wrongCount++;
      });

      if (correctKeys.length > 0) {
        if (correctCount === correctKeys.length && wrongCount === 0) {
          earnedPoints = maxPoints;
          isCorrect = true;
        } else if (correctCount > 0 && wrongCount === 0) {
          // Partial credit
          earnedPoints = Math.round((correctCount / correctKeys.length) * maxPoints);
          isCorrect = false;
        } else {
          earnedPoints = 0;
          isCorrect = false;
        }
      }
      break;
    }

    case 'mc_category': {
      const statements = question.statements || [];
      const answersMap: Record<string, string> = userAnswer || {};
      let correctStatements = 0;

      const displays: string[] = [];
      statements.forEach((stmt) => {
        const expected = (stmt.correctCategory || '').toLowerCase();
        displays.push(`[${stmt.text.slice(0, 30)}...: ${expected.toUpperCase()}]`);
        if (answersMap[stmt.id] && answersMap[stmt.id].toLowerCase() === expected) {
          correctStatements++;
        }
      });
      correctAnswerDisplay = displays.join('; ');

      if (statements.length > 0) {
        const ratio = correctStatements / statements.length;
        earnedPoints = Math.round(ratio * maxPoints);
        isCorrect = correctStatements === statements.length;
      }
      break;
    }

    case 'short_answer': {
      const accepted = (question.acceptedAnswers || []).map((a) =>
        question.caseSensitive ? a.trim() : a.trim().toLowerCase()
      );
      correctAnswerDisplay = (question.acceptedAnswers || []).join(' / ');

      const raw = typeof userAnswer === 'string' ? userAnswer.trim() : '';
      const normalizedUser = question.caseSensitive ? raw : raw.toLowerCase();

      // Check direct equality or containment if appropriate
      if (accepted.some((ans) => ans === normalizedUser || normalizedUser.replace(/\s+/g, '') === ans.replace(/\s+/g, ''))) {
        earnedPoints = maxPoints;
        isCorrect = true;
      }
      break;
    }

    case 'matching': {
      const pairs = question.matchingPairs || [];
      const userMatches: Record<string, string> = userAnswer || {};
      let correctMatches = 0;
      const displays: string[] = [];

      pairs.forEach((p) => {
        displays.push(`[${p.left} -> ${p.right}]`);
        if (userMatches[p.id] && userMatches[p.id] === p.right) {
          correctMatches++;
        }
      });
      correctAnswerDisplay = displays.join('; ');

      if (pairs.length > 0) {
        earnedPoints = Math.round((correctMatches / pairs.length) * maxPoints);
        isCorrect = correctMatches === pairs.length;
      }
      break;
    }

    case 'essay': {
      correctAnswerDisplay = question.essayRubric || 'Lihat rubrik penilaian dan kata kunci';
      const userText = typeof userAnswer === 'string' ? userAnswer.trim().toLowerCase() : '';
      const keywords = (question.essayKeywords || []).map((k) => k.toLowerCase());

      if (keywords.length > 0 && userText.length > 5) {
        let matched = 0;
        keywords.forEach((kw) => {
          if (userText.includes(kw)) matched++;
        });
        const ratio = Math.min(1, matched / Math.max(1, Math.min(3, keywords.length)));
        earnedPoints = Math.round(ratio * maxPoints);
        isCorrect = earnedPoints >= maxPoints * 0.75;
      } else if (userText.length > 20) {
        // Effort score
        earnedPoints = Math.round(maxPoints * 0.5);
        isCorrect = false;
      }
      break;
    }
  }

  return {
    questionId: question.id,
    questionNumber: question.number,
    type: question.type,
    maxPoints,
    earnedPoints,
    isCorrect,
    userAnswer,
    correctAnswerDisplay,
  };
}

export function gradeExam(exam: ExamSubject, answers: Record<string, any>): ScoreSummary {
  let totalEarned = 0;
  let totalMax = 0;
  const breakdown: Record<string, QuestionScoreDetail> = {};

  exam.questions.forEach((q) => {
    const detail = gradeQuestion(q, answers[q.id]);
    breakdown[q.id] = detail;
    totalEarned += detail.earnedPoints;
    totalMax += detail.maxPoints;
  });

  const percentage = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
  const isPassed = percentage >= (exam.passingScore || 75);

  return {
    score: percentage,
    totalEarnedPoints: totalEarned,
    totalMaxPoints: totalMax,
    percentage,
    isPassed,
    breakdown,
  };
}
