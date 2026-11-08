import React, { useState, useEffect } from 'react';
import {
  ExamSubject,
  StudentMember,
  ExamResult,
  LandingPageConfig,
} from './types/cbt';
import { storage } from './utils/storage';
import {
  isSupabaseConfigured,
  testSupabaseConnection,
  fetchExamsFromSupabase,
  fetchStudentsFromSupabase,
  fetchResultsFromSupabase,
  fetchConfigFromSupabase,
} from './services/supabaseService';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { DashboardView } from './views/DashboardView';
import { ExamRegistrationView } from './views/ExamRegistrationView';
import { CbtPlayerView } from './views/CbtPlayerView';
import { LeaderboardView } from './views/LeaderboardView';
import { DownloadPdfView } from './views/DownloadPdfView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { AdminLoginModal } from './views/AdminLoginModal';
import { prepareStudentExamSession } from './utils/randomizer';

export default function App() {
  const [currentTab, setCurrentTab] = useState<
    'dashboard' | 'register_exam' | 'cbt_player' | 'leaderboard' | 'download_pdf' | 'admin'
  >('dashboard');

  const [exams, setExams] = useState<ExamSubject[]>([]);
  const [students, setStudents] = useState<StudentMember[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [config, setConfig] = useState<LandingPageConfig>(storage.getLandingConfig());
  const [isOnlineSupabase, setIsOnlineSupabase] = useState<boolean>(false);
  const [isRefreshingLeaderboard, setIsRefreshingLeaderboard] = useState<boolean>(false);

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);

  // Active testing session
  const [preselectedExamId, setPreselectedExamId] = useState<string | undefined>();
  const [activeExamSession, setActiveExamSession] = useState<{
    fullName: string;
    presensiNumber: number;
    schoolName: string;
    grade: string;
    exam: ExamSubject;
  } | null>(null);

  // Initialize data from persistent storage and sync with Supabase online
  useEffect(() => {
    // 1. Initial immediate load from local cache
    setExams(storage.getExams());
    setStudents(storage.getStudents());
    setResults(storage.getResults());
    setConfig(storage.getLandingConfig());

    // 2. If Supabase credentials configured, fetch live cloud data
    if (isSupabaseConfigured()) {
      testSupabaseConnection().then((test) => {
        if (test.success) {
          setIsOnlineSupabase(true);
          Promise.all([
            fetchExamsFromSupabase(),
            fetchStudentsFromSupabase(),
            fetchResultsFromSupabase(),
            fetchConfigFromSupabase(),
          ]).then(([remExams, remStudents, remResults, remConfig]) => {
            if (remExams && remExams.length > 0) {
              setExams(remExams);
              storage.saveExams(remExams);
            }
            if (remStudents && remStudents.length > 0) {
              setStudents(remStudents);
              storage.saveStudents(remStudents);
            }
            if (remResults) {
              setResults(remResults);
              storage.saveResults(remResults);
            }
            if (remConfig) {
              setConfig(remConfig);
              storage.saveLandingConfig(remConfig);
            }
          });
        } else {
          setIsOnlineSupabase(false);
        }
      });
    }
  }, []);

  // Handlers for starting exam from dashboard or exam cards
  const handleStartExamFromDashboard = (examId?: string) => {
    if (examId) {
      const target = exams.find((e) => e.id === examId);
      if (target && target.status !== 'active') {
        alert(
          `Soal untuk mata pelajaran "${target.title}" belum dirilis oleh admin/pengawas!\nSilakan tunggu hingga pengawas mengklik "Rilis Soal" di sistem CBT.`
        );
        return;
      }
    }
    setPreselectedExamId(examId);
    setCurrentTab('register_exam');
  };

  const handleStartExamSession = (sessionData: {
    fullName: string;
    presensiNumber: number;
    schoolName: string;
    grade: string;
    exam: ExamSubject;
  }) => {
    if (sessionData.exam.status !== 'active') {
      alert('Soal untuk mata pelajaran ini belum dirilis oleh admin/pengawas ruangan!');
      return;
    }

    // Check subject & config randomization settings (default to true)
    const shuffleQ =
      sessionData.exam.randomizeQuestions !== undefined
        ? sessionData.exam.randomizeQuestions
        : config.randomizeQuestions !== false;
    const shuffleO =
      sessionData.exam.randomizeOptions !== undefined
        ? sessionData.exam.randomizeOptions
        : config.randomizeOptions !== false;

    // Generate unique randomized exam sequence for this student
    const randomizedExam = prepareStudentExamSession(sessionData.exam, shuffleQ, shuffleO);

    setActiveExamSession({
      ...sessionData,
      exam: randomizedExam,
    });
    setCurrentTab('cbt_player');
  };

  const handleFinishExam = (newResult: ExamResult) => {
    // Refresh results list from storage
    setResults(storage.getResults());
  };

  const handleRefreshOnlineResults = async () => {
    setIsRefreshingLeaderboard(true);
    if (isSupabaseConfigured()) {
      const remote = await fetchResultsFromSupabase();
      if (remote) {
        setResults(remote);
        storage.saveResults(remote);
      }
    }
    setIsRefreshingLeaderboard(false);
  };

  // Admin login handler
  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setCurrentTab('admin');
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    if (currentTab === 'admin') {
      setCurrentTab('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 antialiased selection:bg-red-500 selection:text-white">
      {/* Hide standard navbar in active CBT test player to maximize student focus */}
      {currentTab !== 'cbt_player' && (
        <Navbar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          isAdminLoggedIn={isAdminLoggedIn}
          onAdminLogout={handleAdminLogout}
          onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
          logoUrl={config.logoUrl}
          schoolName={config.schoolName}
          isOnlineSupabase={isOnlineSupabase}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'dashboard' && (
          <DashboardView
            config={config}
            exams={exams}
            students={students}
            results={results}
            onStartExam={handleStartExamFromDashboard}
            onGoToLeaderboard={() => {
              setCurrentTab('leaderboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
            isAdminLoggedIn={isAdminLoggedIn}
          />
        )}

        {currentTab === 'register_exam' && (
          <ExamRegistrationView
            exams={exams}
            students={students}
            config={config}
            preselectedExamId={preselectedExamId}
            onStartExamSession={handleStartExamSession}
            onGoToDashboard={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'cbt_player' && activeExamSession && (
          <CbtPlayerView
            exam={activeExamSession.exam}
            student={{
              fullName: activeExamSession.fullName,
              presensiNumber: activeExamSession.presensiNumber,
              schoolName: activeExamSession.schoolName,
              grade: activeExamSession.grade,
            }}
            config={config}
            onFinishExam={handleFinishExam}
            onGoToDashboard={() => {
              setActiveExamSession(null);
              setCurrentTab('dashboard');
            }}
            onGoToLeaderboard={() => {
              setActiveExamSession(null);
              setCurrentTab('leaderboard');
            }}
          />
        )}

        {currentTab === 'leaderboard' && (
          <LeaderboardView
            results={results}
            exams={exams}
            onStartExam={handleStartExamFromDashboard}
            onRefresh={handleRefreshOnlineResults}
            isRefreshing={isRefreshingLeaderboard}
            isOnline={isOnlineSupabase}
          />
        )}

        {currentTab === 'download_pdf' && (
          <DownloadPdfView results={results} config={config} />
        )}

        {currentTab === 'admin' && isAdminLoggedIn && (
          <AdminDashboardView
            exams={exams}
            students={students}
            results={results}
            config={config}
            onUpdateExams={(updated) => setExams(updated)}
            onUpdateStudents={(updated) => setStudents(updated)}
            onUpdateResults={(updated) => setResults(updated)}
            onUpdateConfig={(updated) => setConfig(updated)}
          />
        )}
      </main>

      {/* Footer is displayed across main tabs */}
      {currentTab !== 'cbt_player' && (
        <Footer
          schoolName={config.schoolName}
          subDistrict={config.subDistrict}
          regency={config.regency}
        />
      )}

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
}
