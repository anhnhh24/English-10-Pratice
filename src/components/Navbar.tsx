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
  Calculator,
  Languages,
  LogOut,
  Compass,
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
  const { currentSubject, switchSubject, currentUser, mistakes, bookmarks, analytics } = useApp();
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
  const bookmarksCount = bookmarks.length;

  const currentSubjectTarget =
    currentSubject === 'math'
      ? currentUser.targetScoreMath || currentUser.targetScore
      : currentUser.targetScoreEnglish || currentUser.targetScore;

  const navItems: {
    id: TabType;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: BarChart3 },
    {
      id: 'study_path',
      label: 'Lộ trình vào 10',
      icon: Compass,
      badge: 'HOT',
      badgeColor: 'bg-amber-500 text-white animate-pulse',
    },
    {
      id: 'ai_generator',
      label: currentSubject === 'math' ? 'AI Tạo đề Toán' : 'AI Tạo đề Tiếng Anh',
      icon: Wand2,
      badge: 'MỚI',
      badgeColor: 'bg-[#5A5A40] text-white',
    },
    { id: 'mock_exam', label: 'Thi thử vào 10', icon: GraduationCap },
    {
      id: 'mistakes',
      label: 'Sổ câu sai',
      icon: BookMarked,
      badge: activeMistakesCount,
      badgeColor: 'bg-[#E67E22] text-white',
    },
    {
      id: 'lessons',
      label: currentSubject === 'math' ? 'Công thức & Lý thuyết' : 'Học lý thuyết',
      icon: BookOpen,
    },
    { id: 'topic_practice', label: 'Luyện theo chuyên đề', icon: Layers },
    { id: 'quick_blitz', label: 'Luyện nhanh 10 câu', icon: Zap },
    {
      id: 'vocab',
      label: currentSubject === 'math' ? 'Flashcard Công thức' : 'Flashcard Từ vựng',
      icon: Sparkles,
    },
    {
      id: 'bookmarks',
      label: 'Câu đã lưu',
      icon: Bookmark,
      badge: bookmarksCount > 0 ? bookmarksCount : undefined,
    },
    { id: 'analytics', label: 'Báo cáo năng lực', icon: Award },
  ];

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

  const isMath = currentSubject === 'math';
  const theme = {
    primaryBg: isMath ? 'bg-[#1E3A8A]' : 'bg-[#5A5A40]',
    primaryText: isMath ? 'text-[#1E3A8A]' : 'text-[#5A5A40]',
    sidebarBg: isMath ? 'bg-[#E2E8F0]' : 'bg-[#E8E2D9]',
    sidebarBorder: isMath ? 'border-[#CBD5E1]' : 'border-[#D9D2C5]',
    activeNavBg: isMath ? 'bg-[#1E3A8A]' : 'bg-[#5A5A40]',
    accentColor: isMath ? 'text-[#2563EB]' : 'text-[#8BA888]',
    progressBg: isMath ? 'bg-[#2563EB]' : 'bg-[#8BA888]',
  };

  return (
    <>
      {/* SIDEBAR FOR DESKTOP */}
      <aside className={`hidden lg:flex w-64 ${theme.sidebarBg} border-r ${theme.sidebarBorder} flex-col shrink-0 h-screen sticky top-0 transition-colors duration-300`}>
        {/* Brand Header */}
        <div className="p-5 pb-3 space-y-3">
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
                <span className="text-[10px] block font-semibold tracking-widest uppercase text-[#64748B]">
                  Luyện Thi Vào 10
                </span>
              </h1>
            </div>
          </div>

          {/* 1-Click Subject Switcher (Segmented Control) */}
          <div className="bg-[#FAF9F6] p-1 rounded-2xl border border-[#D9D2C5] flex shadow-2xs">
            <button
              onClick={() => switchSubject('english')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                currentSubject === 'english'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'text-[#6B6B54] hover:text-[#3D3D2D] hover:bg-[#E8E2D9]'
              }`}
            >
              <span>🇬🇧</span>
              <span>Tiếng Anh</span>
            </button>

            <button
              onClick={() => switchSubject('math')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                currentSubject === 'math'
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'text-[#6B6B54] hover:text-[#3D3D2D] hover:bg-[#E8E2D9]'
              }`}
            >
              <span>📐</span>
              <span>Toán Học</span>
            </button>
          </div>

          {/* Realtime Connection Status Indicator */}
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#FAF9F6] rounded-xl border border-[#D9D2C5] text-[10px] font-bold">
            <span className="text-[#6B6B54]">Trạng thái kết nối:</span>
            <div className="flex items-center space-x-1.5">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className={isOnline ? 'text-emerald-700' : 'text-amber-700'}>
                {isOnline ? '📡 Online (DB)' : '⚡ Offline'}
              </span>
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
                    ? `${theme.activeNavBg} text-white shadow-sm`
                    : 'text-[#64748B] hover:bg-black/5 hover:text-[#1E293B]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#64748B]'}`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (typeof item.badge === 'string' || item.badge > 0) && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      item.badgeColor || (isActive ? 'bg-white text-[#1E3A8A]' : 'bg-[#E67E22] text-white')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <button
            onClick={() => setActiveTab('admin')}
            id="sidebar-nav-admin"
            className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'admin'
                ? `${theme.activeNavBg} text-white shadow-sm`
                : 'text-[#1E293B] bg-[#FAF9F6] border border-[#CBD5E1] hover:bg-black/5'
            }`}
          >
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              <span>Dashboard Giám Sát</span>
            </div>
            <span
              className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full ${
                currentUser.role === 'admin' ? 'bg-[#2563EB] text-white' : 'bg-black/10 text-[#1E293B]'
              }`}
            >
              {currentUser.role === 'admin' ? 'ADMIN' : 'Giám Sát'}
            </span>
          </button>
        </nav>

        {/* User Account & Goal Card (Bottom) */}
        <div className="p-4 border-t border-[#D9D2C5] space-y-2">
          {/* User Profile Trigger */}
          <div
            onClick={onOpenProfileModal}
            className="bg-[#FAF9F6] hover:bg-white p-2.5 rounded-2xl border border-[#D9D2C5] shadow-2xs flex items-center justify-between cursor-pointer transition group"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl ${
                  currentUser.avatarColor || 'bg-[#5A5A40]'
                } text-white flex items-center justify-center font-bold text-xs shadow-2xs`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#3D3D2D] truncate group-hover:text-[#5A5A40]">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-[#8A8A70] truncate">
                  {currentUser.role === 'admin' ? 'Quản trị viên' : `${currentSubjectTarget}đ ${currentSubject === 'math' ? 'Toán' : 'Anh'}`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8A8A70] group-hover:translate-x-0.5 transition" />
          </div>

          {/* Goal & Target Score Card */}
          <div className="bg-[#FDFCFB] p-3.5 rounded-2xl border border-[#D9D2C5] shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A70]">
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
              <span className="text-xl font-bold text-[#5A5A40]">
                {analytics.averageExamScore.toFixed(1)}
              </span>
              <span className="text-xs text-[#8A8A70] font-medium">
                / {currentSubjectTarget.toFixed(1)}đ NV1
              </span>
            </div>
            <div className="w-full bg-[#E8E2D9] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#8BA888] h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((analytics.averageExamScore / currentSubjectTarget) * 100)
                  )}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-[#8A8A70] truncate">{currentUser.targetSchool}</p>
          </div>
        </div>
      </aside>

      {/* MOBILE / TABLET TOP BAR */}
      <header className="lg:hidden shrink-0 z-30 bg-[#E8E2D9] border-b border-[#D9D2C5] px-3 py-2 flex items-center justify-between shadow-xs">
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center space-x-2 cursor-pointer select-none"
        >
          <div className="w-8 h-8 rounded-xl bg-[#5A5A40] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {currentSubject === 'math' ? 'M10' : 'E10'}
          </div>
          <div>
            <span className="font-bold text-sm text-[#5A5A40] leading-none block">
              {currentSubject === 'math' ? 'MathMaster' : 'EngMaster'}
            </span>
            <span className="text-[9px] text-[#8A8A70] font-semibold uppercase tracking-wider block">Vào 10</span>
          </div>
        </div>

        {/* Center Subject Switcher on Mobile */}
        <div className="flex bg-[#FAF9F6] p-0.5 rounded-xl border border-[#D9D2C5] text-[11px] font-bold">
          <button
            onClick={() => switchSubject('english')}
            className={`px-2 py-1 rounded-lg transition ${
              currentSubject === 'english' ? 'bg-[#5A5A40] text-white' : 'text-[#6B6B54]'
            }`}
          >
            🇬🇧 Anh
          </button>
          <button
            onClick={() => switchSubject('math')}
            className={`px-2 py-1 rounded-lg transition ${
              currentSubject === 'math' ? 'bg-[#5A5A40] text-white' : 'text-[#6B6B54]'
            }`}
          >
            📐 Toán
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={onOpenProfileModal}
            className={`w-7 h-7 rounded-xl ${
              currentUser.avatarColor || 'bg-[#5A5A40]'
            } text-white flex items-center justify-center text-xs font-bold shadow-2xs`}
          >
            {currentUser.name.charAt(0)}
          </button>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-xl bg-[#FAF9F6] hover:bg-[#DED8CE] border border-[#D9D2C5] text-[#5A5A40] transition cursor-pointer"
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
                  {currentSubject === 'math' ? 'M10' : 'E10'}
                </div>
                <div>
                  <span className="font-bold text-[#5A5A40] text-sm leading-none block">
                    {currentSubject === 'math' ? 'Toán Học Vào 10' : 'Tiếng Anh Vào 10'}
                  </span>
                  <span className="text-[10px] text-[#8A8A70]">{currentUser.name}</span>
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
                  Mục tiêu {currentSubject === 'math' ? 'Toán' : 'Anh'}: {currentSubjectTarget}đ
                </p>
                <p className="text-xs font-bold text-[#5A5A40] truncate">{currentUser.targetSchool}</p>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenProfileModal();
                }}
                className="px-3 py-1.5 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white text-[11px] font-bold rounded-xl transition cursor-pointer"
              >
                Hồ sơ & Đổi User
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
                <span>Dashboard Giáo viên / Admin</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
