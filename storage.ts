import { ExamSubject, StudentMember, ExamResult, LandingPageConfig } from '../types/cbt';
import { INITIAL_EXAMS, INITIAL_STUDENTS, INITIAL_RESULTS, INITIAL_LANDING_CONFIG } from '../data/initialData';

const STORAGE_KEYS = {
  EXAMS: 'cbt_selomerto_exams_v1',
  STUDENTS: 'cbt_selomerto_students_v1',
  RESULTS: 'cbt_selomerto_results_v1',
  LANDING: 'cbt_selomerto_landing_v1',
  ADMIN_AUTH: 'cbt_selomerto_admin_pass_v1',
  CURRENT_STUDENT: 'cbt_selomerto_current_student',
};

const DEFAULT_ADMIN_PASS = 'admin123';

export const storage = {
  // Exams
  getExams(): ExamSubject[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXAMS);
      return data ? JSON.parse(data) : INITIAL_EXAMS;
    } catch {
      return INITIAL_EXAMS;
    }
  },
  saveExams(exams: ExamSubject[]): void {
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
  },

  // Students
  getStudents(): StudentMember[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return data ? JSON.parse(data) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  },
  saveStudents(students: StudentMember[]): void {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  },

  // Results
  getResults(): ExamResult[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RESULTS);
      return data ? JSON.parse(data) : INITIAL_RESULTS;
    } catch {
      return INITIAL_RESULTS;
    }
  },
  saveResults(results: ExamResult[]): void {
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
  },
  addResult(result: ExamResult): void {
    const list = this.getResults();
    // remove existing result for same student and same exam if re-testing allowed, or update
    const updated = [result, ...list.filter((r) => !(r.studentId === result.studentId && r.examId === result.examId))];
    this.saveResults(updated);
  },

  // Landing Page Config
  getLandingConfig(): LandingPageConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LANDING);
      return data ? { ...INITIAL_LANDING_CONFIG, ...JSON.parse(data) } : INITIAL_LANDING_CONFIG;
    } catch {
      return INITIAL_LANDING_CONFIG;
    }
  },
  saveLandingConfig(config: LandingPageConfig): void {
    localStorage.setItem(STORAGE_KEYS.LANDING, JSON.stringify(config));
  },

  // Admin Password
  getAdminPassword(): string {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) || DEFAULT_ADMIN_PASS;
  },
  setAdminPassword(newPass: string): void {
    localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, newPass);
  },

  // Current logged in student session
  getCurrentStudent(): StudentMember | null {
    try {
      const data = sessionStorage.getItem(STORAGE_KEYS.CURRENT_STUDENT);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setCurrentStudent(student: StudentMember | null): void {
    if (student) {
      sessionStorage.setItem(STORAGE_KEYS.CURRENT_STUDENT, JSON.stringify(student));
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_STUDENT);
    }
  },

  // Full Database Export & Import
  exportFullBackup(): string {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      exams: this.getExams(),
      students: this.getStudents(),
      results: this.getResults(),
      landingConfig: this.getLandingConfig(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importFullBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.exams && Array.isArray(data.exams)) this.saveExams(data.exams);
      if (data.students && Array.isArray(data.students)) this.saveStudents(data.students);
      if (data.results && Array.isArray(data.results)) this.saveResults(data.results);
      if (data.landingConfig) this.saveLandingConfig(data.landingConfig);
      return true;
    } catch {
      return false;
    }
  },

  resetAllDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.EXAMS);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.RESULTS);
    localStorage.removeItem(STORAGE_KEYS.LANDING);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    sessionStorage.removeItem(STORAGE_KEYS.CURRENT_STUDENT);
  },
};
