export type QuestionType =
  | 'mc_single'     // 1) Pilihan Ganda sederhana (1 dari 4 opsi)
  | 'mc_mcma'       // 2) Pilihan Ganda MCMA (mencentang 2 dari 3/4 opsi jawaban)
  | 'mc_category'   // 3) Pilihan Ganda kategori (Benar/Salah, Tepat/Kurang Tepat, Sesuai/Tidak Sesuai)
  | 'short_answer'  // 4) Isian singkat
  | 'matching'      // 5) Menjodohkan
  | 'essay';        // 6) Uraian

export type CategoryKind = 'benar_salah' | 'tepat_kurang_tepat' | 'sesuai_tidak_sesuai';

export interface CategoryStatement {
  id: string;
  text: string;
  correctCategory: string; // e.g. 'benar' | 'salah' or 'tepat' | 'kurang_tepat' or 'sesuai' | 'tidak_sesuai'
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export type StimulusType = 'none' | 'text' | 'image' | 'chart';

export interface StimulusChartData {
  type: 'bar' | 'pie' | 'line';
  title: string;
  labels: string[];
  values: number[];
  unit?: string;
  color?: string;
}

export interface QuestionOption {
  id: string;
  label: string;
  text: string;
  image?: string; // Data URL or Image URL for option
}

export interface Question {
  id: string;
  number: number;
  type: QuestionType;
  points: number;
  questionText: string;
  
  // Stimulus
  stimulusType: StimulusType;
  stimulusTitle?: string;
  stimulusText?: string;
  stimulusImage?: string; // Data URL or Image URL
  stimulusChart?: StimulusChartData;
  stimulusSource?: 'manual' | 'file_upload' | 'link';
  stimulusLink?: string;

  // Options for mc_single and mc_mcma
  options?: QuestionOption[];
  correctAnswerSingle?: string; // option id (e.g. 'A')
  correctAnswerMcma?: string[]; // option ids (e.g. ['A', 'C'])

  // For mc_category
  categoryKind?: CategoryKind;
  statements?: CategoryStatement[];

  // For short_answer
  acceptedAnswers?: string[]; // e.g. ["fotosintesis", "fotosintesa"]
  caseSensitive?: boolean;

  // For matching
  matchingPairs?: MatchingPair[];

  // For essay
  essayRubric?: string;
  essayKeywords?: string[]; // Auto-scoring helper keywords

  explanation?: string; // Pembahasan
  status?: 'active' | 'draft';
}

export interface ExamSubject {
  id: string;
  title: string;
  subjectCode: string;
  grade: string; // "Kelas 6"
  schoolName: string; // "SD Negeri Selomerto"
  durationMinutes: number;
  totalQuestions: number;
  passingScore: number; // KKM e.g. 75
  academicYear: string;
  semester: string;
  status: 'active' | 'inactive';
  isReleased?: boolean;
  releasedAt?: string;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  questions: Question[];
}

export interface StudentMember {
  id: string;
  fullName: string;
  schoolName: string; // "SD Negeri Selomerto"
  presensiNumber: number;
  grade: string; // "Kelas 6"
  customPassword: string;
  registeredAt: string;
  gender?: 'L' | 'P';
  nisn?: string;
}

export interface QuestionScoreDetail {
  questionId: string;
  questionNumber: number;
  type: QuestionType;
  maxPoints: number;
  earnedPoints: number;
  isCorrect: boolean;
  userAnswer: any;
  correctAnswerDisplay: string;
}

export interface ExamResult {
  id: string;
  studentId: string;
  studentName: string;
  presensiNumber: number;
  schoolName: string;
  grade: string;
  examId: string;
  examTitle: string;
  score: number; // 0 - 100
  totalEarnedPoints: number;
  totalMaxPoints: number;
  percentage: number;
  isPassed: boolean;
  completedAt: string;
  durationSeconds: number;
  answers: Record<string, any>;
  doubtfulAnswers?: Record<string, boolean>;
  breakdown: Record<string, QuestionScoreDetail>;
  cheatCount?: number;
  cheatLog?: string[];
}

export interface LandingPageConfig {
  schoolName: string;
  subDistrict: string;
  regency: string;
  appTitle: string;
  subTitle: string;
  academicYear: string;
  semester: string;
  welcomeMessage: string;
  headmasterName: string;
  headmasterNip: string;
  teacherInCharge: string;
  announcement: string;
  examDateRange: string;
  logoUrl: string;
  heroBannerUrl: string;
  rules: string[];
  antiCheatEnabled?: boolean;
  maxCheatWarnings?: number;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
}

