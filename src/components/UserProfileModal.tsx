import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MistakeItem } from '../types';
import {
  X,
  User,
  LogOut,
  Sparkles,
  Target,
  GraduationCap,
  Users,
  ShieldCheck,
  Check,
  Flame,
  Award,
  BookMarked,
  Calculator,
  Languages,
  RotateCcw,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuthModal: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenAuthModal,
}) => {
  const {
    currentUser,
    usersList,
    switchUser,
    updateUserProfile,
    logout,
    examAttempts,
    mistakes,
    bookmarks,
    resetAllProgress,
  } = useApp();

  const [name, setName] = useState(currentUser.name);
  const [targetSchool, setTargetSchool] = useState(currentUser.targetSchool);
  const [targetScoreMath, setTargetScoreMath] = useState(
    currentUser.targetScoreMath || currentUser.targetScore || 8.5
  );
  const [targetScoreEnglish, setTargetScoreEnglish] = useState(
    currentUser.targetScoreEnglish || currentUser.targetScore || 8.5
  );
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const avg = parseFloat(((targetScoreMath + targetScoreEnglish) / 2).toFixed(1));
    updateUserProfile({
      name,
      targetSchool,
      targetScoreMath,
      targetScoreEnglish,
      targetScore: avg,
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  const handleLogout = () => {
    logout();
    onClose();
    onOpenAuthModal();
  };

  const handleResetData = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu lịch sử làm bài, điểm thi và sổ câu sai về data trắng (0 dữ liệu)?')) {
      resetAllProgress();
      alert('Đã xóa tất cả dữ liệu về data trắng thành công!');
    }
  };

  const activeMistakesCount = (Object.values(mistakes) as MistakeItem[]).filter((m) => !m.mastered).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative bg-[#FAF9F6] border border-[#D9D2C5] rounded-3xl sm:rounded-[2.5rem] shadow-2xl max-w-lg w-full p-5 sm:p-7 space-y-5 my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-xl bg-[#E8E2D9] hover:bg-[#DED8CE] text-[#5A5A40] transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* User Card Header */}
        <div className="flex items-center space-x-3.5 pb-4 border-b border-[#D9D2C5]">
          <div
            className={`w-14 h-14 rounded-2xl ${
              currentUser.avatarColor || 'bg-[#5A5A40]'
            } text-white flex items-center justify-center font-bold text-xl shadow-sm`}
          >
            {currentUser.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-bold text-[#3D3D2D] truncate">
                {currentUser.name}
              </h3>
              <span
                className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                  currentUser.role === 'admin'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-indigo-100 text-indigo-800'
                }`}
              >
                {currentUser.role === 'admin' ? 'Quản trị viên' : 'Học sinh'}
              </span>
            </div>
            <p className="text-xs text-[#8A8A70] truncate">{currentUser.email}</p>
          </div>
        </div>

        {/* User Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 bg-white rounded-2xl border border-[#EAE7E0] space-y-0.5">
            <div className="flex items-center justify-center space-x-1 text-[#E67E22] text-xs font-bold">
              <Flame className="w-3.5 h-3.5 fill-[#E67E22]" />
              <span>{currentUser.streakDays} ngày</span>
            </div>
            <p className="text-[10px] text-[#8A8A70]">Chuỗi học tập</p>
          </div>

          <div className="p-2.5 bg-white rounded-2xl border border-[#EAE7E0] space-y-0.5">
            <div className="flex items-center justify-center space-x-1 text-[#5A5A40] text-xs font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>{examAttempts.length} đề</span>
            </div>
            <p className="text-[10px] text-[#8A8A70]">Lượt thi thử</p>
          </div>

          <div className="p-2.5 bg-white rounded-2xl border border-[#EAE7E0] space-y-0.5">
            <div className="flex items-center justify-center space-x-1 text-red-600 text-xs font-bold">
              <BookMarked className="w-3.5 h-3.5" />
              <span>{activeMistakesCount} câu</span>
            </div>
            <p className="text-[10px] text-[#8A8A70]">Sổ câu sai</p>
          </div>
        </div>

        {/* Edit Goals Form */}
        <form onSubmit={handleSave} className="space-y-3 pt-1">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#4A4A4A]">Họ và tên</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#D9D2C5] rounded-2xl text-xs text-[#3D3D2D] focus:ring-1 focus:ring-[#5A5A40] outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#4A4A4A]">Trường THPT mục tiêu NV1</label>
            <input
              type="text"
              value={targetSchool}
              onChange={(e) => setTargetSchool(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#D9D2C5] rounded-2xl text-xs text-[#3D3D2D] focus:ring-1 focus:ring-[#5A5A40] outline-hidden"
            />
          </div>

          {/* Subject target scores */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-white rounded-2xl border border-[#D9D2C5] space-y-1">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#5A5A40]">
                <Calculator className="w-3.5 h-3.5 text-[#E67E22]" />
                <span>Mục tiêu Toán</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="5"
                  max="10"
                  step="0.25"
                  value={targetScoreMath}
                  onChange={(e) => setTargetScoreMath(parseFloat(e.target.value))}
                  className="w-full accent-[#E67E22]"
                />
                <span className="font-extrabold text-sm text-[#E67E22]">{targetScoreMath}đ</span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-[#D9D2C5] space-y-1">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#5A5A40]">
                <Languages className="w-3.5 h-3.5 text-[#5A5A40]" />
                <span>Mục tiêu Anh</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="5"
                  max="10"
                  step="0.25"
                  value={targetScoreEnglish}
                  onChange={(e) => setTargetScoreEnglish(parseFloat(e.target.value))}
                  className="w-full accent-[#5A5A40]"
                />
                <span className="font-extrabold text-sm text-[#5A5A40]">{targetScoreEnglish}đ</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white font-bold text-xs rounded-2xl shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Đã lưu thông tin!</span>
              </>
            ) : (
              <span>Cập Nhật Mục Tiêu</span>
            )}
          </button>
        </form>

        {/* Account Actions */}
        <div className="pt-2 border-t border-[#D9D2C5] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#8A8A70] uppercase text-[10px] tracking-wider">
              Tài khoản & Phiên đăng nhập:
            </span>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-[#EAE7E0] flex items-center justify-between">
            <div className="flex items-center space-x-2.5 truncate">
              <div
                className={`w-8 h-8 rounded-xl ${
                  currentUser.avatarColor || 'bg-[#5A5A40]'
                } text-white flex items-center justify-center text-xs font-bold`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-[#3D3D2D] truncate">{currentUser.name}</p>
                <p className="text-[10px] text-[#8A8A70] truncate">{currentUser.email}</p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-[#5A5A40] text-white rounded-full font-bold">
              {currentUser.role === 'admin' ? 'Quản trị' : 'Học sinh'}
            </span>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenAuthModal();
            }}
            className="w-full py-2.5 bg-[#F5F2ED] hover:bg-[#EAE7E0] text-[#3D3D2D] font-bold text-xs rounded-xl border border-[#D9D2C5] transition cursor-pointer flex items-center justify-center space-x-2"
          >
            <span>🔐 Đăng nhập tài khoản khác</span>
          </button>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              onClick={handleResetData}
              type="button"
              className="py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs rounded-2xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa Về Data Trắng</span>
            </button>

            <button
              onClick={handleLogout}
              type="button"
              className="py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-2xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng Xuất</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
