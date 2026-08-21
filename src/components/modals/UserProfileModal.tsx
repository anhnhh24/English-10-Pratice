import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MistakeItem } from '../../types';
import {
  X,
  User,
  LogOut,
  Target,
  Check,
  Flame,
  Award,
  BookMarked,
  Calculator,
  Languages,
  RotateCcw,
  Mail,
  Lock,
  Palette,
  School,
  TrendingUp,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuthModal?: () => void;
  onSwitchToLogin?: () => void;
}

const AVATAR_COLORS = [
  { id: 'bg-indigo-600', name: 'Chàm Indigo', color: 'bg-indigo-600' },
  { id: 'bg-blue-600', name: 'Xanh Dương', color: 'bg-blue-600' },
  { id: 'bg-emerald-600', name: 'Xanh Lá', color: 'bg-emerald-600' },
  { id: 'bg-amber-600', name: 'Cam Hổ Phách', color: 'bg-amber-600' },
  { id: 'bg-rose-600', name: 'Hồng Đỏ', color: 'bg-rose-600' },
  { id: 'bg-purple-600', name: 'Tím Quý Tộc', color: 'bg-purple-600' },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenAuthModal,
  onSwitchToLogin,
}) => {
  const triggerOpenAuth = onOpenAuthModal || onSwitchToLogin || (() => {});
  const {
    currentUser,
    updateUserProfile,
    logout,
    examAttempts,
    mistakes,
    analytics,
    resetAllProgress,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'target' | 'stats'>('profile');
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [password, setPassword] = useState(currentUser.password || '123');
  const [avatarColor, setAvatarColor] = useState(currentUser.avatarColor || 'bg-indigo-600');
  const [targetSchool, setTargetSchool] = useState(currentUser.targetSchool || 'THPT Chu Văn An');
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
      name: name.trim() || currentUser.name,
      email: email.trim() || currentUser.email,
      password: password.trim() || currentUser.password,
      avatarColor,
      targetSchool: targetSchool.trim() || currentUser.targetSchool,
      targetScoreMath,
      targetScoreEnglish,
      targetScore: avg,
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  const handleLogout = () => {
    logout();
    onClose();
    triggerOpenAuth();
  };

  const handleResetData = () => {
    if (
      confirm(
        'Bạn có chắc chắn muốn xóa toàn bộ lịch sử làm bài, điểm thi và sổ câu sai về data trắng (0 dữ liệu)?'
      )
    ) {
      resetAllProgress();
      alert('Đã xóa tất cả dữ liệu về data trắng thành công!');
    }
  };

  const activeMistakesCount = (Object.values(mistakes || {}) as MistakeItem[]).filter(
    (m) => !m.mastered
  ).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative bg-white border border-[#D9D2C5] rounded-3xl sm:rounded-[2.5rem] shadow-2xl max-w-lg w-full p-5 sm:p-7 space-y-5 my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-xl bg-[#FAF9F6] hover:bg-[#EAE7E0] text-[#5A5A40] transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* User Card Header */}
        <div className="flex items-center space-x-3.5 pb-4 border-b border-[#EAE7E0]">
          <div
            className={`w-14 h-14 rounded-2xl ${avatarColor} text-white flex items-center justify-center font-extrabold text-2xl shadow-sm transition-colors duration-300`}
          >
            {name ? name.charAt(0).toUpperCase() : currentUser.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-bold text-[#3D3D2D] truncate">
                {name || currentUser.name}
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
            <p className="text-xs text-[#8A8A70] truncate">{email || currentUser.email}</p>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex bg-[#FAF9F6] p-1 rounded-2xl border border-[#D9D2C5] text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === 'profile'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'text-[#6B6B54] hover:text-[#3D3D2D]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Hồ sơ cá nhân</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('target')}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === 'target'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'text-[#6B6B54] hover:text-[#3D3D2D]'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Mục tiêu vào 10</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === 'stats'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'text-[#6B6B54] hover:text-[#3D3D2D]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Thống kê thật</span>
          </button>
        </div>

        {/* Tab 1: Profile Form */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSave} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#4A4A4A] flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-[#5A5A40]" />
                <span>Họ và tên</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập họ và tên..."
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#D9D2C5] rounded-xl text-xs text-[#3D3D2D] focus:ring-1 focus:ring-[#5A5A40] outline-hidden"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#4A4A4A] flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5 text-[#5A5A40]" />
                <span>Email đăng nhập</span>
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email..."
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#D9D2C5] rounded-xl text-xs text-[#3D3D2D] focus:ring-1 focus:ring-[#5A5A40] outline-hidden"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#4A4A4A] flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5 text-[#5A5A40]" />
                <span>Mật khẩu đăng nhập</span>
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu..."
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#D9D2C5] rounded-xl text-xs text-[#3D3D2D] focus:ring-1 focus:ring-[#5A5A40] outline-hidden"
                required
              />
            </div>

            {/* Avatar Color Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-[#4A4A4A] flex items-center space-x-1">
                <Palette className="w-3.5 h-3.5 text-[#5A5A40]" />
                <span>Màu đại diện Avatar</span>
              </label>
              <div className="flex gap-2">
                {AVATAR_COLORS.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setAvatarColor(col.id)}
                    className={`w-8 h-8 rounded-xl ${col.color} transition cursor-pointer flex items-center justify-center ${
                      avatarColor === col.id ? 'ring-2 ring-offset-2 ring-[#5A5A40] scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                    title={col.name}
                  >
                    {avatarColor === col.id && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer mt-3"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Đã lưu thông tin thành công!</span>
                </>
              ) : (
                <span>Lưu Thay Đổi Hồ Sơ</span>
              )}
            </button>
          </form>
        )}

        {/* Tab 2: Target Form */}
        {activeTab === 'target' && (
          <form onSubmit={handleSave} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#4A4A4A] flex items-center space-x-1">
                <School className="w-3.5 h-3.5 text-[#5A5A40]" />
                <span>Trường THPT mục tiêu NV1</span>
              </label>
              <input
                type="text"
                value={targetSchool}
                onChange={(e) => setTargetSchool(e.target.value)}
                placeholder="Ví dụ: THPT Chu Văn An, THPT Kim Liên..."
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#D9D2C5] rounded-xl text-xs text-[#3D3D2D] focus:ring-1 focus:ring-[#5A5A40] outline-hidden"
              />
            </div>

            {/* Subject target scores */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-[#D9D2C5] space-y-1.5">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-[#1E3A8A]">
                  <Calculator className="w-4 h-4 text-[#1E3A8A]" />
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
                    className="w-full accent-[#1E3A8A]"
                  />
                  <span className="font-extrabold text-sm text-[#1E3A8A]">{targetScoreMath}đ</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-[#D9D2C5] space-y-1.5">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-[#5A5A40]">
                  <Languages className="w-4 h-4 text-[#5A5A40]" />
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

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
              <span>Điểm trung bình mục tiêu 2 môn:</span>
              <strong className="text-sm font-black">
                {(((targetScoreMath + targetScoreEnglish) / 2).toFixed(1))}đ
              </strong>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Đã cập nhật mục tiêu!</span>
                </>
              ) : (
                <span>Lưu Mục Tiêu Vào 10</span>
              )}
            </button>
          </form>
        )}

        {/* Tab 3: Real Stats Summary */}
        {activeTab === 'stats' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] space-y-0.5">
                <div className="flex items-center justify-center space-x-1 text-[#E67E22] text-xs font-bold">
                  <Flame className="w-3.5 h-3.5 fill-[#E67E22]" />
                  <span>{currentUser.streakDays || 0} ngày</span>
                </div>
                <p className="text-[10px] text-[#8A8A70]">Chuyên cần</p>
              </div>

              <div className="p-3 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] space-y-0.5">
                <div className="flex items-center justify-center space-x-1 text-[#5A5A40] text-xs font-bold">
                  <Award className="w-3.5 h-3.5" />
                  <span>{examAttempts.length} đề</span>
                </div>
                <p className="text-[10px] text-[#8A8A70]">Đề thi đã làm</p>
              </div>

              <div className="p-3 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] space-y-0.5">
                <div className="flex items-center justify-center space-x-1 text-[#E67E22] text-xs font-bold">
                  <BookMarked className="w-3.5 h-3.5" />
                  <span>{activeMistakesCount} câu</span>
                </div>
                <p className="text-[10px] text-[#8A8A70]">Sổ câu sai</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8A8A70]">Tổng số câu đã giải:</span>
                <strong>{analytics.totalSolved} câu</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A8A70]">Độ chính xác trung bình:</span>
                <strong>{analytics.overallAccuracy}%</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A8A70]">Điểm thi thử trung bình:</span>
                <strong>{analytics.averageExamScore > 0 ? `${analytics.averageExamScore.toFixed(1)}/10đ` : '--'}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Account Actions */}
        <div className="pt-3 border-t border-[#EAE7E0] space-y-2">
          <button
            onClick={() => {
              onClose();
              triggerOpenAuth();
            }}
            className="w-full py-2.5 bg-[#FAF9F6] hover:bg-[#EAE7E0] text-[#3D3D2D] font-bold text-xs rounded-xl border border-[#D9D2C5] transition cursor-pointer flex items-center justify-center space-x-2"
          >
            <span>🔐 Đăng nhập tài khoản khác</span>
          </button>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              onClick={handleResetData}
              type="button"
              className="py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa Về Data Trắng</span>
            </button>

            <button
              onClick={handleLogout}
              type="button"
              className="py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
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

