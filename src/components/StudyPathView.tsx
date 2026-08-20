import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { STUDY_MILESTONES_DATA, INITIAL_DAILY_MISSIONS } from '../data/studyPathData';
import { MATH_ESSAY_PROBLEMS } from '../data/mathEssayData';
import { DailyMission, MathEssayProblem } from '../types';
import {
  Compass,
  CheckCircle2,
  Circle,
  Target,
  ArrowRight,
  Flame,
  Award,
  Sparkles,
  BookOpen,
  AlertTriangle,
  FileText,
  ChevronRight,
  ShieldAlert,
  Zap,
  Lightbulb,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudyPathViewProps {
  onStartExam?: (examId: string) => void;
  onPracticeTopic?: (topicId: string) => void;
}

export const StudyPathView: React.FC<StudyPathViewProps> = ({
  onStartExam,
  onPracticeTopic,
}) => {
  const { currentSubject, currentUser } = useApp();
  const [missions, setMissions] = useState<DailyMission[]>(INITIAL_DAILY_MISSIONS);
  const [activeTab, setActiveTab] = useState<'roadmap' | 'essay_guide' | 'missions'>('roadmap');
  const [selectedEssay, setSelectedEssay] = useState<MathEssayProblem | null>(MATH_ESSAY_PROBLEMS[0]);

  const isMath = currentSubject === 'math';
  const theme = {
    primaryBg: isMath ? 'bg-[#1E3A8A]' : 'bg-[#5A5A40]',
    primaryText: isMath ? 'text-[#1E3A8A]' : 'text-[#5A5A40]',
    accentColor: isMath ? 'text-[#2563EB]' : 'text-[#8BA888]',
    borderActive: isMath ? 'border-[#2563EB]' : 'border-[#8BA888]',
    badgeBg: isMath ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const subjectMilestones = STUDY_MILESTONES_DATA.filter((m) => m.subject === currentSubject);
  const subjectMissions = missions.filter((m) => m.subject === currentSubject);

  const handleToggleMission = (id: string) => {
    setMissions((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextState = !m.completed;
          if (nextState) {
            confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
          }
          return { ...m, completed: nextState };
        }
        return m;
      })
    );
  };

  const completedMissionsCount = subjectMissions.filter((m) => m.completed).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in">
      {/* 1. Header Banner */}
      <div className={`${theme.primaryBg} text-white p-6 sm:p-8 rounded-[2rem] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors duration-300`}>
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-white">
              {isMath ? '📐 Lộ Trình Môn Toán' : '🇬🇧 Lộ Trình Tiếng Anh'}
            </span>
            <span className="px-2.5 py-0.5 bg-amber-400 text-[#1E293B] text-[10px] font-extrabold rounded-full">
              Khóa Thi 2026
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Lộ Trình Bứt Phá Điểm Thi Vào Lớp 10
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Dành riêng cho <strong>{currentUser.name}</strong> • Mục tiêu: <strong>{currentUser.targetSchool}</strong> ({isMath ? currentUser.targetScoreMath || 8.5 : currentUser.targetScoreEnglish || 8.5}đ)
          </p>
        </div>

        {/* Quick Target Box */}
        <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/20 text-center min-w-[170px] shrink-0">
          <p className="text-[10px] uppercase font-bold text-white/70">Nhiệm vụ hôm nay</p>
          <div className="text-2xl font-black text-amber-300 mt-0.5">
            {completedMissionsCount}/{subjectMissions.length}
          </div>
          <p className="text-[11px] text-white/90 font-medium">Hoàn thành để nhận thưởng</p>
        </div>
      </div>

      {/* 2. Top Segmented Navigation Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-[#E2E8F0] flex gap-1 shadow-2xs">
        <button
          onClick={() => setActiveTab('roadmap')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'roadmap'
              ? `${theme.primaryBg} text-white shadow-xs`
              : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>3 Chặng Lộ Trình Đến Ngày Thi</span>
        </button>

        <button
          onClick={() => setActiveTab('missions')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'missions'
              ? `${theme.primaryBg} text-white shadow-xs`
              : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Nhiệm Vụ Mục Tiêu Mỗi Ngày</span>
          {completedMissionsCount < subjectMissions.length && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>

        {isMath && (
          <button
            onClick={() => setActiveTab('essay_guide')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'essay_guide'
                ? `${theme.primaryBg} text-white shadow-xs`
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Bí Kíp Trình Bày Tự Luận Toán</span>
          </button>
        )}
      </div>

      {/* 3. TAB 1: ROADMAP 3 CHẶNG */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          {subjectMilestones.map((milestone) => {
            const isFinished = milestone.completedTopicCount === milestone.topics.length;
            return (
              <div
                key={milestone.id}
                className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-[#E2E8F0] shadow-xs space-y-5"
              >
                {/* Milestone Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F1F5F9]">
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg text-white shrink-0 shadow-sm ${
                        milestone.phaseNumber === 1
                          ? 'bg-emerald-600'
                          : milestone.phaseNumber === 2
                          ? 'bg-blue-600'
                          : 'bg-amber-600'
                      }`}
                    >
                      {milestone.phaseNumber}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                          Chặng {milestone.phaseNumber}
                        </span>
                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-extrabold">
                          {milestone.scoreTarget}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#1E293B] mt-0.5">{milestone.title}</h3>
                      <p className="text-xs text-[#64748B] mt-1">{milestone.description}</p>
                    </div>
                  </div>
                </div>

                {/* Topics in Milestone */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {milestone.topics.map((t) => (
                    <div
                      key={t.topicId}
                      className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] flex flex-col justify-between space-y-3 hover:border-[#CBD5E1] transition"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-[#1E293B]">{t.topicName}</h4>
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                        <p className="text-[11px] text-[#64748B] leading-relaxed">{t.description}</p>
                      </div>

                      <div className="pt-2 border-t border-[#E2E8F0]/60 space-y-2">
                        <div className="p-2 bg-amber-50 rounded-xl border border-amber-200/60 flex items-start space-x-1.5 text-[10px] text-amber-900 font-medium">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{t.mustMasterKey}</span>
                        </div>

                        <button
                          onClick={() => onPracticeTopic && onPracticeTopic(t.topicId)}
                          className="w-full py-2 bg-white hover:bg-[#1E293B] hover:text-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#334155] transition flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <span>Luyện chuyên đề này</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. TAB 2: DAILY MISSIONS */}
      {activeTab === 'missions' && (
        <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-[#E2E8F0] shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#1E293B]">Mục Tiêu Rèn Luyện Hôm Nay</h3>
              <p className="text-xs text-[#64748B]">
                Hoàn thành đều đặn mỗi ngày để xây dựng phản xạ giải nhanh và duy trì chuỗi học tập (Streak)
              </p>
            </div>
            <div className="flex items-center space-x-1 px-3 py-1.5 bg-amber-50 text-amber-800 rounded-2xl border border-amber-200 font-bold text-xs">
              <Flame className="w-4 h-4 text-amber-600" />
              <span>Chuỗi 7 ngày liên tiếp 🔥</span>
            </div>
          </div>

          <div className="space-y-3">
            {subjectMissions.map((mission) => (
              <div
                key={mission.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                  mission.completed
                    ? 'bg-emerald-50/60 border-emerald-200 text-[#065F46]'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#1E293B]'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <button
                    onClick={() => handleToggleMission(mission.id)}
                    className="mt-0.5 shrink-0 text-emerald-600 hover:scale-110 transition cursor-pointer"
                  >
                    {mission.completed ? (
                      <CheckCircle2 className="w-5 h-5 fill-emerald-500 text-white" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#94A3B8]" />
                    )}
                  </button>
                  <div className="space-y-0.5">
                    <p className={`text-xs sm:text-sm font-bold ${mission.completed ? 'line-through text-[#64748B]' : 'text-[#1E293B]'}`}>
                      {mission.title}
                    </p>
                    <p className="text-[11px] text-[#64748B]">{mission.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className="px-2.5 py-1 bg-white border border-[#CBD5E1] rounded-xl text-[11px] font-bold text-[#334155]">
                    +{mission.rewardPoints} XP
                  </span>

                  {!mission.completed && (
                    <button
                      onClick={() => {
                        if (mission.type === 'exam' && onStartExam && mission.targetId) {
                          onStartExam(mission.targetId);
                        } else if (mission.type === 'topic_practice' && onPracticeTopic && mission.targetId) {
                          onPracticeTopic(mission.targetId);
                        }
                      }}
                      className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#1E293B] text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Bắt đầu</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB 3: ESSAY GUIDE (MÔN TOÁN) */}
      {activeTab === 'essay_guide' && isMath && (
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-[#E2E8F0] shadow-xs space-y-6">
            <div>
              <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-bold">
                ⚠️ Tránh Mất Điểm Oan Uổng
              </span>
              <h3 className="text-xl font-bold text-[#1E293B] mt-1">
                Bí Kíp Trình Bày Tự Luận Toán Tuyển Sinh 10 (Chuẩn Barem Sở GD&ĐT)
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Đề thi Toán vào lớp 10 chấm theo barem từng bước (0.25đ - 0.5đ). Xem ngay cách trình bày chuẩn chỉnh và các bẫy trừ điểm phổ biến nhất.
              </p>
            </div>

            {/* Problem Selector Buttons */}
            <div className="flex flex-wrap gap-2 pb-2 border-b border-[#F1F5F9]">
              {MATH_ESSAY_PROBLEMS.map((prob) => (
                <button
                  key={prob.id}
                  onClick={() => setSelectedEssay(prob)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedEssay?.id === prob.id
                      ? 'bg-[#1E3A8A] text-white shadow-xs'
                      : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#E2E8F0]'
                  }`}
                >
                  <span>{prob.title}</span>
                  <span className="ml-1.5 opacity-80 text-[10px]">({prob.examWeight})</span>
                </button>
              ))}
            </div>

            {/* Selected Problem Detail */}
            {selectedEssay && (
              <div className="space-y-5 animate-in fade-in">
                {/* Problem Statement */}
                <div className="p-4 sm:p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs sm:text-sm text-blue-900 flex items-center space-x-1.5">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span>Đề Bài Mẫu: {selectedEssay.title}</span>
                    </h4>
                    <span className="text-[11px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                      Trọng số: {selectedEssay.examWeight}
                    </span>
                  </div>
                  <p className="text-xs text-[#334155] whitespace-pre-line font-mono bg-white p-3.5 rounded-xl border border-blue-100 leading-relaxed">
                    {selectedEssay.problemContent}
                  </p>
                </div>

                {/* Steps with Barem Points & Traps */}
                <div className="space-y-4">
                  <h4 className="font-bold text-xs text-[#1E293B] uppercase tracking-wider">
                    Các Bước Trình Bày Chuẩn Barem Từng Điểm:
                  </h4>

                  {selectedEssay.steps.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="p-4 sm:p-5 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs sm:text-sm text-[#1E3A8A]">
                          {step.stepTitle}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md">
                          +{step.pointWeight}
                        </span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-[#E2E8F0] text-xs text-[#334155] whitespace-pre-line font-mono leading-relaxed">
                        {step.stepDetail}
                      </div>

                      <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200/80 flex items-start space-x-2 text-[11px] text-rose-900 font-medium">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span><strong>Bẫy trừ điểm:</strong> {step.trapsToAvoid}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Final Answer Summary */}
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-900">
                    🎯 Đáp số kết luận: {selectedEssay.finalAnswer}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
