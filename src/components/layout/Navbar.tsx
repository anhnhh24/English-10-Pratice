import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MistakeItem } from '../../types';
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
  Calculator,
  Languages,
  LogOut,
  Compass,
  Sun,
  Moon,
  Coffee,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'study_path'
  | 'ai_generator'
  | 'lessons'
  | 'topic_practice'
  | 'quick_blitz'
  | 'mock_exam'
  | 'mistakes'
  | 'bookmarks'
  | 'vocab'
  | 'analytics'
  | 'admin';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenTargetModal: () => void;
  onOpenProfileModal: () => void;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenTargetModal,
  onOpenProfileModal,
  onOpenAuthModal,
}) => {
  const { currentSubject, switchSubject, currentUser, mistakes, bookmarks, analytics, getQuestionById, themeMode, setThemeMode } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const activeMistakesCount = (Object.values(mistakes) as MistakeItem[]).filter(
    (m) => !m.mastered && (m.subject || 'english') === currentSubject
  ).length;
  const bookmarksCount = bookmarks
    .map((id) => getQuestionById(id))
    .filter((q) => q && (q.subject || 'english') === currentSubject).length;

  const currentSubjectTarget =
    currentSubject === 'math'
      ? currentUser.targetScoreMath || currentUser.targetScore
      : currentUser.targetScoreEnglish || currentUser.targetScore;

  const isMath = currentSubject === 'math';

  const navSections: {
    title: string;
    items: {
      id: TabType;
      label: string;
      icon: React.ElementType;
      badge?: number | string;
      badgeColor?: string;
    }[];
  }[] = [
    {
      title: 'TRỌNG TÂM ÔN THI',
      items: [
        { id: 'dashboard', label: 'Tổng quan', icon: BarChart3 },
        {
          id: 'study_path',
          label: 'Lộ trình vào 10',
          icon: Compass,
          badge: 'HOT',
          badgeColor: 'bg-amber-500 text-white animate-pulse',
        },
        { id: 'mock_exam', label: 'Thi thử vào 10', icon: GraduationCap },
      ],
    },
    {
      title: 'LUYỆN TẬP & BÀI HỌC',
      items: [
        { id: 'topic_practice', label: 'Luyện chuyên đề', icon: Layers },
        { id: 'quick_blitz', label: 'Luyện nhanh 10 câu', icon: Zap },
        {
          id: 'ai_generator',
          label: isMath ? 'AI Tạo đề Toán' : 'AI Tạo đề Tiếng Anh',
          icon: Wand2,
          badge: 'MỚI',
          badgeColor: 'bg-[#5A5A40] text-white',
        },
        {
          id: 'lessons',
          label: isMath ? 'Công thức & Lý thuyết' : 'Học lý thuyết',
          icon: BookOpen,
        },
      ],
    },
    {
      title: 'CỦNG CỐ & ĐÁNH GIÁ',
      items: [
        {
          id: 'mistakes',
          label: 'Sổ câu sai',
          icon: BookMarked,
          badge: activeMistakesCount > 0 ? activeMistakesCount : undefined,
          badgeColor: 'bg-[#E67E22] text-white',
        },
        {
          id: 'vocab',
          label: isMath ? 'Flashcard Công thức' : 'Flashcard Từ vựng',
          icon: Sparkles,
        },
        {
          id: 'bookmarks',
          label: 'Câu đã lưu',
          icon: Bookmark,
          badge: bookmarksCount > 0 ? bookmarksCount : undefined,
        },
        { id: 'analytics', label: 'Báo cáo năng lực', icon: Award },
      ],
    },
  ];

  const allNavItems = navSections.flatMap((s) => s.items);

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

  const theme = {
    primaryBg:
      themeMode === 'dark'
        ? isMath ? 'bg-[#2563EB]' : 'bg-[#3B82F6]'
        : themeMode === 'sepia'
        ? isMath ? 'bg-[#8B5A2B]' : 'bg-[#6D5438]'
        : isMath ? 'bg-[#1E3A8A]' : 'bg-[#5A5A40]',
    primaryText:
      themeMode === 'dark'
        ? 'text-slate-100'
        : themeMode === 'sepia'
        ? 'text-[#3F3324]'
        : isMath ? 'text-[#1E3A8A]' : 'text-[#5A5A40]',
    sidebarBg:
      themeMode === 'dark'
        ? 'bg-[#0F172A]'
        : themeMode === 'sepia'
        ? 'bg-[#EADFCA]'
        : isMath ? 'bg-[#E2E8F0]' : 'bg-[#E8E2D9]',
    sidebarBorder:
      themeMode === 'dark'
        ? 'border-[#1E293B]'
        : themeMode === 'sepia'
        ? 'border-[#D8C8AF]'
        : isMath ? 'border-[#CBD5E1]' : 'border-[#D9D2C5]',
    activeNavBg:
      themeMode === 'dark'
        ? isMath ? 'bg-[#2563EB]' : 'bg-[#334155]'
        : themeMode === 'sepia'
        ? isMath ? 'bg-[#8B5A2B]' : 'bg-[#6D5438]'
        : isMath ? 'bg-[#1E3A8A]' : 'bg-[#5A5A40]',
    cardBg:
      themeMode === 'dark'
        ? 'bg-[#1E293B]'
        : themeMode === 'sepia'
        ? 'bg-[#FAF4E6]'
        : 'bg-[#FAF9F6]',
    cardBorder:
      themeMode === 'dark'
        ? 'border-[#334155]'
        : themeMode === 'sepia'
        ? 'border-[#D8C8AF]'
        : 'border-[#D9D2C5]',
    textMuted:
      themeMode === 'dark'
        ? 'text-slate-400'
        : themeMode === 'sepia'
        ? 'text-[#7E6C54]'
        : 'text-[#8A8A70]',
  };

  return (
    <>
      {/* SIDEBAR FOR DESKTOP */}
      <aside className={`hidden lg:flex w-64 ${theme.sidebarBg} border-r ${theme.sidebarBorder} flex-col shrink-0 h-screen sticky top-0 transition-colors duration-300`}>
        {/* Brand Header */}
        <div className="p-4 pb-2 space-y-2.5">
          <div
            onClick={() => setActiveTab('dashboard')}
            className="cursor-pointer group flex items-center space-x-3"
          >
            <div className={`w-10 h-10 rounded-2xl ${theme.primaryBg} text-white flex items-center justify-center font-bold text-lg shadow-sm transition-colors duration-300`}>
              {currentSubject === 'math' ? 'M10' : 'E10'}
            </div>
            <div>
              <h1 className={`text-lg font-bold ${theme.primaryText} tracking-tight leading-tight transition-colors duration-300`}>
                {currentSubject === 'math' ? 'MathMaster' : 'EngMaster'}
                <span className={`text-[10px] block font-semibold tracking-widest uppercase ${theme.textMuted}`}>
                  Luyện Thi Vào 10
                </span>
              </h1>
            </div>
          </div>

          {/* 1-Click Subject Switcher (Segmented Control) */}
          <div className={`${theme.cardBg} p-1 rounded-2xl border ${theme.cardBorder} flex shadow-2xs`}>
            <button
              onClick={() => switchSubject('english')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                currentSubject === 'english'
                  ? `${theme.activeNavBg} text-white shadow-xs`
                  : `${theme.textMuted} hover:opacity-90`
              }`}
            >
              <span>🇬🇧</span>
              <span>Tiếng Anh</span>
            </button>

            <button
              onClick={() => switchSubject('math')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                currentSubject === 'math'
                  ? isMath && themeMode === 'dark' ? 'bg-blue-600 text-white shadow-xs' : `${theme.activeNavBg} text-white shadow-xs`
                  : `${theme.textMuted} hover:opacity-90`
              }`}
            >
              <span>📐</span>
              <span>Toán Học</span>
            </button>
          </div>
        </div>

        {/* Grouped Navigation Items */}
        <nav className="flex-1 px-3 py-1 space-y-3 overflow-y-auto no-scrollbar">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#8A8A70]">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`sidebar-nav-${item.id}`}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        isActive
                          ? `${theme.activeNavBg} text-white shadow-xs`
                          : 'text-[#64748B] hover:bg-black/5 hover:text-[#1E293B]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#64748B]'}`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && (typeof item.badge === 'string' || item.badge > 0) && (
                        <span
                          className={`px-1.5 py-0.2 text-[9px] font-bold rounded-full shrink-0 ml-1 ${
                            item.badgeColor || (isActive ? 'bg-white text-[#1E3A8A]' : 'bg-[#E67E22] text-white')
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {currentUser.role === 'admin' && (
            <div className="pt-1">
              <button
                onClick={() => setActiveTab('admin')}
                id="sidebar-nav-admin"
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'admin'
                    ? `${theme.activeNavBg} text-white shadow-xs`
                    : 'text-[#1E293B] bg-[#FAF9F6] border border-[#CBD5E1] hover:bg-black/5'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                  <span>Dashboard Giáo Viên</span>
                </div>
                <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded-full bg-[#2563EB] text-white">
                  ADMIN
                </span>
              </button>
            </div>
          )}
        </nav>

        {/* User Account & Goal Card (Bottom) */}
        <div className={`p-4 border-t ${theme.sidebarBorder} space-y-2`}>
          {/* User Profile Trigger */}
          <div
            onClick={onOpenProfileModal}
            className={`${theme.cardBg} hover:opacity-95 p-2.5 rounded-2xl border ${theme.cardBorder} shadow-2xs flex items-center justify-between cursor-pointer transition group`}
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl ${
                  currentUser.avatarColor || theme.primaryBg
                } text-white flex items-center justify-center font-bold text-xs shadow-2xs`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold ${theme.primaryText} truncate`}>
                  {currentUser.name}
                </p>
                <p className={`text-[10px] ${theme.textMuted} truncate`}>
                  {currentUser.role === 'admin' ? 'Quản trị viên' : `${currentSubjectTarget}đ ${currentSubject === 'math' ? 'Toán' : 'Anh'}`}
                </p>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 ${theme.textMuted} group-hover:translate-x-0.5 transition`} />
          </div>

          {/* Theme Mode Toggle (Light / Dark / Sepia) */}
          <div className={`${theme.cardBg} p-1 rounded-2xl border ${theme.cardBorder} flex items-center justify-between text-xs font-bold shadow-2xs`}>
            <button
              onClick={() => setThemeMode('light')}
              className={`flex-1 py-1 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 ${
                themeMode === 'light'
                  ? `${theme.activeNavBg} text-white shadow-2xs`
                  : `${theme.textMuted} hover:opacity-90`
              }`}
              title="Giao diện Sáng tự nhiên"
            >
              <Sun className="w-3 h-3" />
              <span className="text-[10px]">Sáng</span>
            </button>
            <button
              onClick={() => setThemeMode('dark')}
              className={`flex-1 py-1 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 ${
                themeMode === 'dark'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : `${theme.textMuted} hover:opacity-90`
              }`}
              title="Chế độ Ban đêm (Dark Mode)"
            >
              <Moon className="w-3 h-3" />
              <span className="text-[10px]">Tối</span>
            </button>
            <button
              onClick={() => setThemeMode('sepia')}
              className={`flex-1 py-1 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 ${
                themeMode === 'sepia'
                  ? 'bg-[#6D5438] text-amber-100 shadow-2xs'
                  : `${theme.textMuted} hover:opacity-90`
              }`}
              title="Chế độ Đọc sách Giấy vàng (Warm Sepia)"
            >
              <Coffee className="w-3 h-3" />
              <span className="text-[10px]">Đọc</span>
            </button>
          </div>

          {/* Goal & Target Score Card */}
          <div className={`${theme.cardBg} p-3.5 rounded-2xl border ${theme.cardBorder} shadow-xs space-y-1.5`}>
            <div className="flex items-center justify-between">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${theme.textMuted}`}>
                Mục tiêu môn {currentSubject === 'math' ? 'Toán' : 'Anh'}
              </p>
              <button
                onClick={onOpenTargetModal}
                className="text-[#E67E22] hover:underline text-[10px] font-bold cursor-pointer"
              >
                Đổi
              </button>
            </div>
            <div className="flex items-end justify-between">
              <span className={`text-xl font-bold ${theme.primaryText}`}>
                {analytics.averageExamScore.toFixed(1)}
              </span>
              <span className={`text-xs ${theme.textMuted} font-medium`}>
                / {currentSubjectTarget.toFixed(1)}đ NV1
              </span>
            </div>
            <div className="w-full bg-black/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((analytics.averageExamScore / currentSubjectTarget) * 100)
                  )}%`,
                }}
              />
            </div>
            <p className={`text-[10px] ${theme.textMuted} truncate`}>{currentUser.targetSchool}</p>
          </div>
        </div>
      </aside>

      {/* MOBILE / TABLET TOP BAR */}
      <header className={`lg:hidden shrink-0 z-30 ${theme.sidebarBg} border-b ${theme.sidebarBorder} px-3 py-2 flex items-center justify-between shadow-xs transition-colors duration-300`}>
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center space-x-2 cursor-pointer select-none"
        >
          <div className={`w-8 h-8 rounded-xl ${theme.primaryBg} text-white flex items-center justify-center font-bold text-xs shadow-xs`}>
            {currentSubject === 'math' ? 'M10' : 'E10'}
          </div>
          <div>
            <span className={`font-bold text-sm ${theme.primaryText} leading-none block`}>
              {currentSubject === 'math' ? 'MathMaster' : 'EngMaster'}
            </span>
            <span className={`text-[9px] ${theme.textMuted} font-semibold uppercase tracking-wider block`}>Vào 10</span>
          </div>
        </div>

        {/* Center Subject Switcher on Mobile */}
        <div className={`flex ${theme.cardBg} p-0.5 rounded-xl border ${theme.cardBorder} text-[11px] font-bold`}>
          <button
            onClick={() => switchSubject('english')}
            className={`px-2 py-1 rounded-lg transition ${
              currentSubject === 'english' ? `${theme.activeNavBg} text-white` : theme.textMuted
            }`}
          >
            🇬🇧 Anh
          </button>
          <button
            onClick={() => switchSubject('math')}
            className={`px-2 py-1 rounded-lg transition ${
              currentSubject === 'math' ? isMath && themeMode === 'dark' ? 'bg-blue-600 text-white' : `${theme.activeNavBg} text-white` : theme.textMuted
            }`}
          >
            📐 Toán
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-1.5">
          {/* Quick theme switcher button */}
          <button
            onClick={() => {
              if (themeMode === 'light') setThemeMode('dark');
              else if (themeMode === 'dark') setThemeMode('sepia');
              else setThemeMode('light');
            }}
            className={`p-2 rounded-xl ${theme.cardBg} border ${theme.cardBorder} ${theme.textMuted} hover:opacity-90 transition cursor-pointer`}
            title={`Chế độ hiện tại: ${themeMode}`}
          >
            {themeMode === 'dark' ? (
              <Moon className="w-4 h-4 text-amber-300" />
            ) : themeMode === 'sepia' ? (
              <Coffee className="w-4 h-4 text-[#C8671B]" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
          </button>
          {/* Quick profile / Target button */}
          <button
            onClick={onOpenProfileModal}
            className={`p-1.5 rounded-xl ${theme.cardBg} border ${theme.cardBorder} flex items-center space-x-1 cursor-pointer`}
          >
            <div
              className={`w-6 h-6 rounded-lg ${
                currentUser.avatarColor || theme.primaryBg
              } text-white flex items-center justify-center font-bold text-[10px]`}
            >
              {currentUser.name.charAt(0)}
            </div>
          </button>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`p-1.5 rounded-xl ${theme.cardBg} hover:opacity-90 border ${theme.cardBorder} ${theme.textMuted} transition cursor-pointer`}
            aria-label="Mở danh mục ôn thi"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 ${theme.cardBg}/95 backdrop-blur-md border-t ${theme.cardBorder} px-2 py-1.5 flex items-center justify-around shadow-lg transition-colors duration-300`}>
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer ${
                isActive
                  ? `${theme.primaryText} font-bold`
                  : `${theme.textMuted} hover:opacity-90`
              }`}
            >
              <div
                className={`p-1 rounded-xl transition ${
                  item.isSpecial
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                    : isActive
                    ? `${theme.primaryBg} text-white`
                    : ''
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-0 right-2 px-1 py-0.2 bg-[#E67E22] text-white text-[8px] font-bold rounded-full min-w-3.5 text-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Menu More Drawer Button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer ${
            mobileMenuOpen ? `${theme.primaryText} font-bold` : `${theme.textMuted} hover:opacity-90`
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
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className={`relative ${theme.sidebarBg} rounded-t-[2.5rem] p-5 sm:p-6 max-h-[85vh] overflow-y-auto space-y-4 border-t ${theme.sidebarBorder} shadow-2xl z-10 animate-in slide-in-from-bottom duration-300`}>
            <div className={`flex justify-between items-center pb-3 border-b ${theme.sidebarBorder}`}>
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-xl ${theme.primaryBg} text-white flex items-center justify-center font-bold text-xs`}>
                  {currentSubject === 'math' ? 'M10' : 'E10'}
                </div>
                <div>
                  <span className={`font-bold ${theme.primaryText} text-sm leading-none block`}>
                    {currentSubject === 'math' ? 'Toán Học Vào 10' : 'Tiếng Anh Vào 10'}
                  </span>
                  <span className={`text-[10px] ${theme.textMuted}`}>{currentUser.name}</span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className={`p-1.5 rounded-xl ${theme.cardBg} ${theme.textMuted} hover:opacity-90 transition cursor-pointer`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Theme Selector in Mobile Drawer */}
            <div className={`${theme.cardBg} p-1 rounded-2xl border ${theme.cardBorder} flex items-center justify-between text-xs font-bold shadow-2xs`}>
              <button
                onClick={() => setThemeMode('light')}
                className={`flex-1 py-1 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 ${
                  themeMode === 'light'
                    ? `${theme.activeNavBg} text-white shadow-2xs`
                    : theme.textMuted
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Sáng</span>
              </button>
              <button
                onClick={() => setThemeMode('dark')}
                className={`flex-1 py-1 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 ${
                  themeMode === 'dark'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : theme.textMuted
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Tối</span>
              </button>
              <button
                onClick={() => setThemeMode('sepia')}
                className={`flex-1 py-1 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 ${
                  themeMode === 'sepia'
                    ? 'bg-[#6D5438] text-amber-100 shadow-2xs'
                    : theme.textMuted
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>Đọc sách</span>
              </button>
            </div>

            {/* Target Card in Mobile Drawer */}
            <div className={`${theme.cardBg} p-3.5 rounded-2xl border ${theme.cardBorder} flex items-center justify-between`}>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${theme.textMuted}`}>
                  Mục tiêu {currentSubject === 'math' ? 'Toán' : 'Anh'}: {currentSubjectTarget}đ
                </p>
                <p className={`text-xs font-bold ${theme.primaryText} truncate`}>{currentUser.targetSchool}</p>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenProfileModal();
                }}
                className={`px-3 py-1.5 ${theme.primaryBg} text-white text-[11px] font-bold rounded-xl transition cursor-pointer`}
              >
                Hồ sơ & Đổi User
              </button>
            </div>

            {/* All Navigation Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {allNavItems.map((item) => {
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
                        ? `${theme.activeNavBg} text-white shadow-xs`
                        : `${theme.cardBg} ${theme.textMuted} border ${theme.cardBorder} hover:opacity-90`
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
                  <ShieldCheck className="w-4 h-4 text-[#8BA888]" />
                  <span>Dashboard Giáo Viên</span>
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
