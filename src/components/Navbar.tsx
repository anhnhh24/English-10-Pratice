import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MistakeItem } from '../types';
import {
  BarChart3,
  BookOpen,
  Layers,
  Zap,
  GraduationCap,
  BookMarked,
  Sparkles,
  Volume2,
  FileEdit,
  AlignLeft,
  Bookmark,
  Award,
  ShieldCheck,
  Target,
  Edit3,
  Flame,
  UserCheck,
  ChevronDown,
  Menu,
  X,
  Wand2,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'ai_generator'
  | 'lessons'
  | 'topic_practice'
  | 'quick_blitz'
  | 'mock_exam'
  | 'mistakes'
  | 'bookmarks'
  | 'vocab'
  | 'pronunciation'
  | 'rewrite'
  | 'reading'
  | 'analytics'
  | 'admin';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenTargetModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenTargetModal }) => {
  const { currentUser, switchUserRole, mistakes, bookmarks, analytics } = useApp();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeMistakesCount = (Object.values(mistakes) as MistakeItem[]).filter((m) => !m.mastered).length;
  const bookmarksCount = bookmarks.length;

  const navItems: {
    id: TabType;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: BarChart3 },
    {
      id: 'ai_generator',
      label: 'AI Tạo đề theo yêu cầu',
      icon: Wand2,
      badge: 'MỚI',
      badgeColor: 'bg-[#5A5A40] text-white animate-pulse',
    },
    { id: 'mock_exam', label: 'Thi thử vào 10', icon: GraduationCap },
    {
      id: 'mistakes',
      label: 'Sổ câu sai',
      icon: BookMarked,
      badge: activeMistakesCount,
      badgeColor: 'bg-[#E67E22] text-white',
    },
    { id: 'lessons', label: 'Học lý thuyết', icon: BookOpen },
    { id: 'topic_practice', label: 'Luyện theo chủ đề', icon: Layers },
    { id: 'quick_blitz', label: 'Luyện nhanh 10 câu', icon: Zap },
    { id: 'vocab', label: 'Flashcard Từ vựng', icon: Sparkles },
    {
      id: 'bookmarks',
      label: 'Câu đã lưu',
      icon: Bookmark,
      badge: bookmarksCount > 0 ? bookmarksCount : undefined,
    },
    { id: 'analytics', label: 'Báo cáo năng lực', icon: Award },
  ];

  return (
    <>
      {/* SIDEBAR FOR DESKTOP */}
      <aside className="hidden lg:flex w-64 bg-[#E8E2D9] border-r border-[#D9D2C5] flex-col shrink-0 h-screen sticky top-0">
        {/* Brand Header */}
        <div className="p-6 mb-2">
          <div
            onClick={() => setActiveTab('dashboard')}
            className="cursor-pointer group flex items-center space-x-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#5A5A40] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              E10
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#5A5A40] tracking-tight">
                EngMaster
                <span className="text-[10px] block font-semibold tracking-widest uppercase text-[#8A8A70]">
                  Lớp 10 Entrance Prep
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-[#5A5A40] text-white shadow-sm'
                    : 'text-[#6B6B54] hover:bg-[#DED8CE] hover:text-[#3D3D2D]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#6B6B54]'}`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      item.badgeColor || (isActive ? 'bg-white text-[#5A5A40]' : 'bg-[#E67E22] text-white')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {currentUser.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`w-full flex items-center space-x-3 p-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-[#5A5A40] text-white shadow-sm'
                  : 'text-[#5A5A40] bg-[#FAF9F6] border border-[#D9D2C5] hover:bg-[#DED8CE]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Quản trị Admin</span>
            </button>
          )}
        </nav>

        {/* Goal & Target Card (As in Design HTML) */}
        <div className="p-4 border-t border-[#D9D2C5]">
          <div className="bg-[#FDFCFB] p-4 rounded-2xl border border-[#D9D2C5] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A70]">
                Mục tiêu điểm số
              </p>
              <button
                onClick={onOpenTargetModal}
                className="text-[#E67E22] hover:underline text-[10px] font-bold"
              >
                Đổi
              </button>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-[#5A5A40]">
                {analytics.averageExamScore.toFixed(1)}
              </span>
              <span className="text-xs text-[#8A8A70] font-medium">
                / {currentUser.targetScore.toFixed(1)} NV1
              </span>
            </div>
            <div className="w-full bg-[#E8E2D9] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#8BA888] h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((analytics.averageExamScore / currentUser.targetScore) * 100)
                  )}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-[#8A8A70] truncate">{currentUser.targetSchool}</p>
          </div>
        </div>
      </aside>

      {/* MOBILE / TABLET TOP BAR */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#E8E2D9] border-b border-[#D9D2C5] px-4 py-3 flex items-center justify-between">
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-[#5A5A40] text-white flex items-center justify-center font-bold text-sm">
            E10
          </div>
          <span className="font-bold text-base text-[#5A5A40]">EngMaster 10</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenTargetModal}
            className="px-2.5 py-1 bg-[#FDFCFB] border border-[#D9D2C5] rounded-xl text-xs font-bold text-[#5A5A40]"
          >
            🎯 {currentUser.targetScore}đ
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-[#FAF9F6] border border-[#D9D2C5] text-[#5A5A40]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* MOBILE MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-[#E8E2D9] rounded-t-[2.5rem] p-6 max-h-[80vh] overflow-y-auto space-y-2 border-t border-[#D9D2C5]">
            <div className="flex justify-between items-center pb-3 border-b border-[#D9D2C5]">
              <span className="font-bold text-[#5A5A40] text-sm">Danh mục ôn thi</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-[#8A8A70]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`p-3 rounded-2xl text-left text-xs font-bold transition flex items-center space-x-2 ${
                      isActive
                        ? 'bg-[#5A5A40] text-white shadow-xs'
                        : 'bg-[#FAF9F6] text-[#6B6B54] border border-[#D9D2C5]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
