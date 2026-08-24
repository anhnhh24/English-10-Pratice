import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Lock,
  Mail,
  User,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Languages,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, register, usersList, switchUser } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [targetSchool, setTargetSchool] = useState('THPT Chu Văn An / Kim Liên');
  const [targetScoreEnglish, setTargetScoreEnglish] = useState(8.5);
  const [targetScoreMath, setTargetScoreMath] = useState(8.5);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ Email.');
      return;
    }

    const res = login(email, password);
    if (res.success) {
      setSuccessMessage(res.message || 'Đăng nhập thành công!');
      setTimeout(() => {
        onClose();
        setSuccessMessage('');
      }, 700);
    } else {
      setErrorMessage(res.message || 'Đăng nhập thất bại.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên của bạn.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ Email.');
      return;
    }
    if (password.length < 3) {
      setErrorMessage('Mật khẩu tối thiểu từ 3 ký tự.');
      return;
    }

    const res = register({
      name,
      email,
      password,
      targetScore: parseFloat(((targetScoreEnglish + targetScoreMath) / 2).toFixed(1)),
      targetScoreEnglish,
      targetScoreMath,
      targetSchool,
    });

    if (res.success) {
      setSuccessMessage('Đăng ký tài khoản thành công! Đang chuyển hướng...');
      setTimeout(() => {
        onClose();
        setSuccessMessage('');
      }, 700);
    } else {
      setErrorMessage(res.message || 'Đăng ký thất bại.');
    }
  };

  const handleQuickLogin = (userId: string) => {
    const targetUser = usersList.find((u) => u.id === userId);
    if (targetUser?.isLocked) {
      setErrorMessage(`Tài khoản "${targetUser.name}" đang bị tạm khóa bởi Admin. Vui lòng liên hệ quản trị viên.`);
      return;
    }
    switchUser(userId);
    setSuccessMessage('Đã chuyển sang tài khoản thành công!');
    setTimeout(() => {
      onClose();
      setSuccessMessage('');
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative bg-[#FAF9F6] border border-[#D9D2C5] rounded-3xl sm:rounded-[2.5rem] shadow-2xl max-w-lg w-full p-5 sm:p-7 space-y-4 my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-xl bg-[#E8E2D9] hover:bg-[#DED8CE] text-[#5A5A40] transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#5A5A40] text-white flex items-center justify-center font-bold text-sm shadow-xs">
            🎓
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-[#3D3D2D]">
              {mode === 'login' ? 'Đăng Nhập Tài Khoản' : 'Tạo Tài Khoản Luyện Thi Mới'}
            </h3>
            <p className="text-xs text-[#8A8A70]">Lưu trữ đề thi & lịch sử làm bài riêng biệt</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#E8E2D9] p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              mode === 'login'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'text-[#6B6B54] hover:text-[#3D3D2D]'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              mode === 'register'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'text-[#6B6B54] hover:text-[#3D3D2D]'
            }`}
          >
            Đăng Ký Mới
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-700 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Forms */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#4A4A4A] flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-[#8A8A70]" />
                <span>Tài khoản / Email đăng nhập</span>
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập 'admin' hoặc email học sinh..."
                autoComplete="username"
                className="w-full px-3.5 py-2.5 bg-white border border-[#D9D2C5] rounded-2xl text-xs text-[#3D3D2D] focus:ring-1 focus:ring-[#5A5A40] outline-hidden"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#4A4A4A] flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-[#8A8A70]" />
                <span>Mật khẩu</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 bg-white border border-[#D9D2C5] rounded-2xl text-xs text-[#3D3D2D] focus:ring-1 focus:ring-[#5A5A40] outline-hidden"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white font-bold text-xs rounded-2xl shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Đăng Nhập Vào Hệ Thống</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 pt-1 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#4A4A4A] flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-[#8A8A70]" />
                <span>Họ và tên học sinh *</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Trần Tuấn Anh"
                className="w-full px-3.5 py-2.5 bg-white border border-[#D9D2C5] rounded-2xl text-xs text-[#3D3D2D] focus:ring-1 focus:ring-[#5A5A40] outline-hidden"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#4A4A4A] flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-[#8A8A70]" />
                <span>Email *</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tuananh.lop9@gmail.com"
                className="w-full px-3.5 py-2.5 bg-white border border-[#D9D2C5] rounded-2xl text-xs text-[#3D3D2D] focus:ring-1 focus:ring-[#5A5A40] outline-hidden"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#4A4A4A] flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-[#8A8A70]" />
                <span>Mật khẩu *</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full px-3.5 py-2.5 bg-white border border-[#D9D2C5] rounded-2xl text-xs text-[#3D3D2D] focus:ring-1 focus:ring-[#5A5A40] outline-hidden"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#4A4A4A] flex items-center space-x-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-[#8A8A70]" />
                <span>Trường THPT mục tiêu NV1</span>
              </label>
              <input
                type="text"
                value={targetSchool}
                onChange={(e) => setTargetSchool(e.target.value)}
                placeholder="Ví dụ: THPT Chu Văn An / Chuyên Ngoại Ngữ"
                className="w-full px-3.5 py-2.5 bg-white border border-[#D9D2C5] rounded-2xl text-xs text-[#3D3D2D] focus:ring-1 focus:ring-[#5A5A40] outline-hidden"
              />
            </div>

            {/* Target Scores for both subjects */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-3 bg-white rounded-2xl border border-[#D9D2C5] space-y-1">
                <div className="flex items-center space-x-1.5 text-[#5A5A40] font-bold text-xs">
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
                <div className="flex items-center space-x-1.5 text-[#5A5A40] font-bold text-xs">
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
              className="w-full mt-2 py-3 bg-[#E67E22] hover:bg-[#D35400] text-white font-bold text-xs rounded-2xl shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Đăng Ký & Bắt Đầu Học Ngay</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
