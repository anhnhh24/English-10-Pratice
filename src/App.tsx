import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Navbar, TabType } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
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

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [targetModalOpen, setTargetModalOpen] = useState<boolean>(false);
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

  return (
    <div className="flex h-screen w-full bg-[#F5F2ED] text-[#4A4A4A] font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTargetModal={() => setTargetModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 flex flex-col overflow-y-auto">
        <div className="max-w-6xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              setActiveTab={setActiveTab}
              onStartExam={handleStartExam}
              onPracticeTopic={handlePracticeTopic}
              onOpenTargetModal={() => setTargetModalOpen(true)}
            />
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

      {/* Target Setting Modal */}
      <TargetSettingModal
        isOpen={targetModalOpen}
        onClose={() => setTargetModalOpen(false)}
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
