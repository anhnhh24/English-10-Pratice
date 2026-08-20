import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar, TabType } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { AiExamGeneratorView } from './components/AiExamGeneratorView';
import { ExamSimulatorView } from './components/ExamSimulatorView';
import { MistakeNotebookView } from './components/MistakeNotebookView';
import { LessonsView } from './components/LessonsView';
import { TopicPracticeView } from './components/TopicPracticeView';
import { QuickBlitzView } from './components/QuickBlitzView';
import { VocabFlashcardsView } from './components/VocabFlashcardsView';
import { AnalyticsView } from './components/AnalyticsView';
import { BookmarksView } from './components/BookmarksView';
import { AdminPanel } from './components/AdminPanel';
import { TargetSettingModal } from './components/TargetSettingModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { RealtimeStudentTaskListener } from './components/RealtimeStudentTaskListener';

const AppContent: React.FC = () => {
  const { currentSubject } = useApp();
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
          {activeTab === 'dashboard' && (
            <Dashboard
              setActiveTab={setActiveTab}
              onStartExam={handleStartExam}
              onPracticeTopic={handlePracticeTopic}
              onOpenTargetModal={() => setTargetModalOpen(true)}
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

          {activeTab === 'admin' && <AdminPanel />}
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

      {/* Authentication Modal (Login / Register / 1-Click Demo Accounts) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* User Profile & Account Switching Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
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
