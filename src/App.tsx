import React, { useState, lazy, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar, TabType } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { TargetSettingModal } from './components/TargetSettingModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { RealtimeStudentTaskListener } from './components/RealtimeStudentTaskListener';

// Lazy loading heavy view components for optimal bundle splitting
const AiExamGeneratorView = lazy(() => import('./components/AiExamGeneratorView').then(m => ({ default: m.AiExamGeneratorView })));
const ExamSimulatorView = lazy(() => import('./components/ExamSimulatorView').then(m => ({ default: m.ExamSimulatorView })));
const MistakeNotebookView = lazy(() => import('./components/MistakeNotebookView').then(m => ({ default: m.MistakeNotebookView })));
const LessonsView = lazy(() => import('./components/LessonsView').then(m => ({ default: m.LessonsView })));
const TopicPracticeView = lazy(() => import('./components/TopicPracticeView').then(m => ({ default: m.TopicPracticeView })));
const QuickBlitzView = lazy(() => import('./components/QuickBlitzView').then(m => ({ default: m.QuickBlitzView })));
const VocabFlashcardsView = lazy(() => import('./components/VocabFlashcardsView').then(m => ({ default: m.VocabFlashcardsView })));
const AnalyticsView = lazy(() => import('./components/AnalyticsView').then(m => ({ default: m.AnalyticsView })));
const BookmarksView = lazy(() => import('./components/BookmarksView').then(m => ({ default: m.BookmarksView })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));
const StudyPathView = lazy(() => import('./components/StudyPathView').then(m => ({ default: m.StudyPathView })));

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

            {activeTab === 'admin' && (
              currentUser.role === 'admin' ? (
                <AdminPanel />
              ) : (
                <Dashboard
                  setActiveTab={setActiveTab}
                  onStartExam={handleStartExam}
                  onPracticeTopic={handlePracticeTopic}
                  onOpenTargetModal={() => setTargetModalOpen(true)}
                />
              )
            )}
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
