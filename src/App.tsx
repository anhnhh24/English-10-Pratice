import React, { useState, lazy, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar, TabType } from './components/layout/Navbar';
import { RealtimeStudentTaskListener } from './components/layout/RealtimeStudentTaskListener';
import { Dashboard } from './components/student/Dashboard';
import { TargetSettingModal } from './components/modals/TargetSettingModal';
import { AuthModal } from './components/modals/AuthModal';
import { UserProfileModal } from './components/modals/UserProfileModal';

// Lazy loading heavy view components for optimal bundle splitting
const AiExamGeneratorView = lazy(() =>
  import('./components/student/AiExamGeneratorView').then((m) => ({
    default: m.AiExamGeneratorView,
  }))
);
const ExamSimulatorView = lazy(() =>
  import('./components/student/ExamSimulatorView').then((m) => ({
    default: m.ExamSimulatorView,
  }))
);
const MistakeNotebookView = lazy(() =>
  import('./components/student/MistakeNotebookView').then((m) => ({
    default: m.MistakeNotebookView,
  }))
);
const LessonsView = lazy(() =>
  import('./components/student/LessonsView').then((m) => ({ default: m.LessonsView }))
);
const TopicPracticeView = lazy(() =>
  import('./components/student/TopicPracticeView').then((m) => ({
    default: m.TopicPracticeView,
  }))
);
const QuickBlitzView = lazy(() =>
  import('./components/student/QuickBlitzView').then((m) => ({
    default: m.QuickBlitzView,
  }))
);
const VocabFlashcardsView = lazy(() =>
  import('./components/student/VocabFlashcardsView').then((m) => ({
    default: m.VocabFlashcardsView,
  }))
);
const AnalyticsView = lazy(() =>
  import('./components/student/AnalyticsView').then((m) => ({
    default: m.AnalyticsView,
  }))
);
const BookmarksView = lazy(() =>
  import('./components/student/BookmarksView').then((m) => ({
    default: m.BookmarksView,
  }))
);
const AdminPanel = lazy(() =>
  import('./components/admin/AdminPanel').then((m) => ({ default: m.AdminPanel }))
);
const StudyPathView = lazy(() =>
  import('./components/student/StudyPathView').then((m) => ({
    default: m.StudyPathView,
  }))
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-12 w-full min-h-[300px]">
    <div className="flex flex-col items-center space-y-3">
      <div className="w-8 h-8 border-4 border-[#1E3A8A] border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-bold text-[#64748B]">Đang tải màn hình...</span>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { currentSubject, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [targetModalOpen, setTargetModalOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [activeExamId, setActiveExamId] = useState<string>('exam_official_01');
  const [activePracticeTopicId, setActivePracticeTopicId] = useState<string>('grammar');

  const handleStartExam = (examId: string) => {
    setActiveExamId(examId);
    setActiveTab('mock_exam');
  };

  const handlePracticeTopic = (topicId: string) => {
    setActivePracticeTopicId(topicId);
    setActiveTab('topic_practice');
  };

  const isMath = currentSubject === 'math';

  // Tự động reset trạng thái điều hướng khi chuyển môn để không bị nhảy đề hoặc thực hiện hành động cũ
  React.useEffect(() => {
    setActiveExamId(isMath ? 'math_exam_official_01' : 'exam_official_01');
    setActivePracticeTopicId(isMath ? 'math_pt_bac_hai_viet' : 'grammar');
    // Nếu đang trong màn hình làm bài thi hoặc luyện đề, tự động quay về trang chủ môn học mới
    if (['mock_exam', 'topic_practice', 'quick_blitz'].includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [currentSubject]);

  // ═════════════════════════════════════════════════════════════════
  // 🛡️ DEDICATED ADMIN PORTAL (Trang Quản Trị & Giám Sát Riêng Biệt)
  // ═════════════════════════════════════════════════════════════════
  if (currentUser.role === 'admin') {
    return (
      <div className="min-h-screen w-full bg-[#FAF9F6] text-[#334155] font-sans flex flex-col overflow-x-hidden">
        {/* Dedicated Admin Header */}
        <header className="bg-white border-b border-[#EAE7E0] sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white flex items-center justify-center font-bold text-base shadow-sm">
              🛡️
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-extrabold text-base sm:text-lg text-[#3D3D2D] leading-tight">
                  Edu10 • Trung Tâm Quản Trị & Giám Sát
                </h1>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-extrabold rounded-full">
                  ADMIN PORTAL
                </span>
              </div>
              <p className="text-xs text-[#8A8A70]">
                Quản lý học sinh, đề thi AI, trích xuất file đề & theo dõi bài làm realtime
              </p>
            </div>
          </div>

          {/* Admin User Info & Actions */}
          <div className="flex items-center space-x-2.5">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-[#FAF9F6] rounded-xl border border-[#EAE7E0] text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[#3D3D2D] font-bold">Admin (Giám Sát)</span>
            </div>

            <button
              onClick={() => setProfileModalOpen(true)}
              className="px-3.5 py-2 bg-[#F5F2ED] hover:bg-[#EAE7E0] text-[#3D3D2D] rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border border-[#D9D2C5]"
            >
              <span>👤 Tài khoản</span>
            </button>

            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border border-red-200"
            >
              <span>🚪 Đổi tài khoản</span>
            </button>
          </div>
        </header>

        {/* Admin Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Suspense fallback={<LoadingSpinner />}>
            <AdminPanel />
          </Suspense>
        </main>

        {/* Authentication Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />

        {/* User Profile Modal */}
        <UserProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          onOpenAuthModal={() => setAuthModalOpen(true)}
          onSwitchToLogin={() => setAuthModalOpen(true)}
        />
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // 🎓 STUDENT PORTAL (Trang Luyện Thi Cho Học Sinh)
  // ═════════════════════════════════════════════════════════════════
  return (
    <div className={`flex flex-col lg:flex-row h-screen w-full ${isMath ? 'bg-[#F0F4F8]' : 'bg-[#F5F2ED]'} text-[#334155] font-sans overflow-hidden transition-colors duration-300`}>
      {/* Sidebar Navigation (Desktop) & Top Header + Bottom Bar (Mobile) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTargetModal={() => setTargetModalOpen(true)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onOpenProfileModal={() => setProfileModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-20 lg:pb-8 flex flex-col overflow-y-auto w-full">
        <div className="max-w-6xl w-full mx-auto">
          <Suspense fallback={<LoadingSpinner />}>
            {activeTab === 'dashboard' && (
              <Dashboard
                setActiveTab={setActiveTab}
                onStartExam={handleStartExam}
                onPracticeTopic={handlePracticeTopic}
                onOpenTargetModal={() => setTargetModalOpen(true)}
              />
            )}

            {activeTab === 'study_path' && (
              <StudyPathView
                onStartExam={handleStartExam}
                onPracticeTopic={handlePracticeTopic}
              />
            )}

            {activeTab === 'ai_generator' && (
              <AiExamGeneratorView onStartExam={handleStartExam} />
            )}

            {activeTab === 'mock_exam' && (
              <ExamSimulatorView
                examId={activeExamId}
                onBackToDashboard={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'mistakes' && <MistakeNotebookView />}

            {activeTab === 'lessons' && (
              <LessonsView onPracticeTopic={handlePracticeTopic} />
            )}

            {activeTab === 'topic_practice' && (
              <TopicPracticeView
                initialTopicId={activePracticeTopicId}
                onBackToDashboard={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'quick_blitz' && (
              <QuickBlitzView onBackToDashboard={() => setActiveTab('dashboard')} />
            )}

            {activeTab === 'vocab' && <VocabFlashcardsView />}

            {activeTab === 'analytics' && (
              <AnalyticsView
                onOpenTargetModal={() => setTargetModalOpen(true)}
                onPracticeWeakness={handlePracticeTopic}
              />
            )}

            {activeTab === 'bookmarks' && <BookmarksView />}
          </Suspense>
        </div>
      </main>

      {/* Real-time remote task listener banner */}
      <RealtimeStudentTaskListener
        onStartExam={handleStartExam}
        onPracticeTopic={handlePracticeTopic}
      />

      {/* Target Setting Modal */}
      <TargetSettingModal
        isOpen={targetModalOpen}
        onClose={() => setTargetModalOpen(false)}
      />

      {/* Authentication Modal (Login / Register) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* User Profile & Account Switching Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onSwitchToLogin={() => setAuthModalOpen(true)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
