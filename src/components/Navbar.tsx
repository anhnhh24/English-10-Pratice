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
  Bookmark,
  Award,
  ShieldCheck,
  Target,
  Menu,
  X,
  Wand2,
  ChevronRight,
  User,
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
  const { currentUser, mistakes, bookmarks, analytics } = useApp();
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

  // 4 main tabs for bottom bar
  const bottomNavItems = [
    { id: 'dashboard' as TabType, label: 'Tổng quan', icon: BarChart3 },
    { id: 'mock_exam' as TabType, label: 'Thi thử', icon: GraduationCap },
    { id: 'ai_generator' as TabType, label: 'Tạo đề AI', icon: Wand2, isSpecial: true },
    {
      id: 'mistakes' as TabType,
      label: 'Sổ câu sai',
      icon: BookMarked,
      badge: activeMistakesCount > 0 ? activeMistakesCount : undefined,
    },
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
                {item.badge !== undefined && (typeof item.badge === 'string' || item.badge > 0) && (
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

        {/* Goal & Target Card */}
        <div className="p-4 border-t border-[#D9D2C5]">
          <div className="bg-[#FDFCFB] p-4 rounded-2xl border border-[#D9D2C5] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A70]">
                Mục tiêu điểm số
              </p>
              <button
                onClick={onOpenTargetModal}
                className="text-[#E67E22] hover:underline text-[10px] font-bold cursor-pointer"
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
      <header className="lg:hidden shrink-0 z-30 bg-[#E8E2D9] border-b border-[#D9D2C5] px-3.5 py-2.5 flex items-center justify-between shadow-xs">
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center space-x-2 cursor-pointer select-none"
        >
          <div className="w-8 h-8 rounded-xl bg-[#5A5A40] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            E10
          </div>
          <div>
            <span className="font-bold text-sm text-[#5A5A40] leading-none block">EngMaster</span>
            <span className="text-[9px] text-[#8A8A70] font-semibold uppercase tracking-wider block">Vào 10</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenTargetModal}
            className="px-2.5 py-1 bg-[#FDFCFB] hover:bg-[#FAF9F6] border border-[#D9D2C5] rounded-xl text-xs font-bold text-[#5A5A40] flex items-center space-x-1 cursor-pointer transition shadow-2xs"
          >
            <span>🎯</span>
            <span>{currentUser.targetScore}đ</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-[#FAF9F6] hover:bg-[#DED8CE] border border-[#D9D2C5] text-[#5A5A40] transition cursor-pointer"
            aria-label="Mở danh mục ôn thi"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-t border-[#D9D2C5] px-2 py-1.5 flex items-center justify-around shadow-lg">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition relative cursor-pointer ${
                isActive
                  ? 'text-[#5A5A40] font-bold'
                  : 'text-[#8A8A70] hover:text-[#5A5A40]'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1 rounded-xl transition ${
                    isActive ? 'bg-[#5A5A40] text-white shadow-2xs' : ''
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 bg-[#E67E22] text-white text-[9px] font-extrabold rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}

        {/* More / Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer ${
            mobileMenuOpen ? 'text-[#5A5A40] font-bold' : 'text-[#8A8A70] hover:text-[#5A5A40]'
          }`}
        >
          <div className="p-1 rounded-xl">
            <Menu className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 whitespace-nowrap">Menu</span>
        </button>
      </nav>

      {/* MOBILE FULL MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative bg-[#E8E2D9] rounded-t-[2.5rem] p-5 sm:p-6 max-h-[85vh] overflow-y-auto space-y-4 border-t border-[#D9D2C5] shadow-2xl z-10 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center pb-3 border-b border-[#D9D2C5]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#5A5A40] text-white flex items-center justify-center font-bold text-xs">
                  E10
                </div>
                <div>
                  <span className="font-bold text-[#5A5A40] text-sm leading-none block">Danh mục ôn thi</span>
                  <span className="text-[10px] text-[#8A8A70]">Lớp 10 Entrance Prep</span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-xl bg-[#FAF9F6] text-[#8A8A70] hover:text-[#3D3D2D] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Card in Mobile Drawer */}
            <div className="bg-[#FDFCFB] p-3.5 rounded-2xl border border-[#D9D2C5] flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A70]">
                  Mục tiêu NV1: {currentUser.targetScore} điểm
                </p>
                <p className="text-xs font-bold text-[#5A5A40] truncate">{currentUser.targetSchool}</p>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenTargetModal();
                }}
                className="px-3 py-1.5 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white text-[11px] font-bold rounded-xl transition cursor-pointer"
              >
                Đổi mục tiêu
              </button>
            </div>

            {/* All Navigation Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
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
                    className={`p-3 rounded-2xl text-left text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-[#5A5A40] text-white shadow-xs'
                        : 'bg-[#FAF9F6] text-[#6B6B54] border border-[#D9D2C5] hover:bg-[#DED8CE]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge !== undefined && (typeof item.badge === 'string' || item.badge > 0) && (
                      <span
                        className={`px-1.5 py-0.2 text-[9px] font-bold rounded-full shrink-0 ml-1 ${
                          item.badgeColor || (isActive ? 'bg-white text-[#5A5A40]' : 'bg-[#E67E22] text-white')
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {currentUser.role === 'admin' && (
              <button
                onClick={() => {
                  setActiveTab('admin');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-[#5A5A40] text-white shadow-xs'
                    : 'text-[#5A5A40] bg-[#FAF9F6] border border-[#D9D2C5]'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Khu vực Quản trị Admin</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
