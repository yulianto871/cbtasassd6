import { ExamSubject, Question, QuestionOption } from '../types/cbt';

/**
 * Fisher-Yates array shuffle algorithm (unbiased)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Prepares an exam for a student session with randomized question sequence
 * and randomized answer options if enabled.
 *
 * Each question's internal ID and option IDs remain intact, guaranteeing
 * 100% accurate auto-grading while providing a unique layout per student.
 */
export function prepareStudentExamSession(
  exam: ExamSubject,
  shouldShuffleQuestions: boolean = true,
  shouldShuffleOptions: boolean = true
): ExamSubject {
  let questions = [...exam.questions];

  // 1. Shuffle Questions if enabled
  if (shouldShuffleQuestions) {
    questions = shuffleArray(questions);
  }

  // 2. Re-assign sequential question numbers (1, 2, 3... N) for student UI
  // and shuffle options if enabled
  const preparedQuestions: Question[] = questions.map((q, qIndex) => {
    let preparedQ: Question = {
      ...q,
      number: qIndex + 1, // display number 1..N
    };

    if (shouldShuffleOptions && q.options && q.options.length > 0) {
      if (q.type === 'mc_single' || q.type === 'mc_mcma') {
        const shuffledOptions = shuffleArray(q.options);
        preparedQ.options = shuffledOptions;
      }
    }

    return preparedQ;
  });

  return {
    ...exam,
    questions: preparedQuestions,
  };
}
