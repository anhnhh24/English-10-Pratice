import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Target, School, Sparkles, Check, X } from 'lucide-react';

interface TargetSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TargetSettingModal: React.FC<TargetSettingModalProps> = ({ isOpen, onClose }) => {
  const { currentSubject, currentUser, updateUserProfile } = useApp();
  const getSubjectScore = () =>
    currentSubject === 'math'
      ? currentUser.targetScoreMath || currentUser.targetScore || 8.5
      : currentUser.targetScoreEnglish || currentUser.targetScore || 8.5;

  const [score, setScore] = useState<number>(getSubjectScore);
  const [school, setSchool] = useState<string>(
    currentUser.targetSchool || 'THPT Chu Văn An (Hà Nội)'
  );

  React.useEffect(() => {
    if (isOpen) {
      setScore(getSubjectScore());
      setSchool(currentUser.targetSchool || 'THPT Chu Văn An (Hà Nội)');
    }
  }, [currentUser, currentSubject, isOpen]);

  if (!isOpen) return null;

  const popularSchools = [
    'THPT Chu Văn An (Hà Nội)',
    'THPT Kim Liên (Hà Nội)',
    'THPT Yên Hòa (Hà Nội)',
    'THPT Chuyên Hà Nội - Amsterdam',
    'THPT Lê Hồng Phong (TP.HCM)',
    'THPT Nguyễn Thị Minh Khai (TP.HCM)',
    'THPT Bùi Thị Xuân (TP.HCM)',
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentSubject === 'math') {
      const engScore = currentUser.targetScoreEnglish || score;
      updateUserProfile({
        targetScoreMath: score,
        targetSchool: school.trim() || currentUser.targetSchool,
        targetScore: parseFloat(((score + engScore) / 2).toFixed(1)),
      });
    } else {
      const mathScore = currentUser.targetScoreMath || score;
      updateUserProfile({
        targetScoreEnglish: score,
        targetSchool: school.trim() || currentUser.targetSchool,
        targetScore: parseFloat(((mathScore + score) / 2).toFixed(1)),
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-[2.5rem] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#EAE7E0] animate-in fade-in zoom-in-95 duration-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0]">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#F5F2ED] text-[#5A5A40] flex items-center justify-center border border-[#D9D2C5]">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#3D3D2D] text-base">Thiết lập Mục tiêu Điểm số</h3>
              <p className="text-xs text-[#8A8A70]">Lộ trình ôn thi Tuyển sinh vào Lớp 10</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8A8A70] hover:text-[#3D3D2D] rounded-xl hover:bg-[#FAF9F6] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#4A4A4A] mb-1">
              Mục tiêu điểm {currentSubject === 'math' ? 'Môn Toán' : 'Môn Tiếng Anh'} vào 10 (Thang điểm 10):
            </label>
            <div className="flex items-center space-x-3 mt-2">
              <input
                type="range"
                min="5.0"
                max="10.0"
                step="0.25"
                value={score}
                onChange={(e) => setScore(parseFloat(e.target.value))}
                className="w-full accent-[#5A5A40] h-2 bg-[#E8E2D9] rounded-lg cursor-pointer"
              />
              <span className="font-extrabold text-2xl text-[#5A5A40] w-16 text-right">
                {score.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-[#8A8A70] mt-1 font-medium">
              <span>5.0 (Cơ bản)</span>
              <span>7.5 (Khá)</span>
              <span>8.5+ (Giỏi)</span>
              <span>9.5+ (Chuyên)</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#4A4A4A] mb-1">
              Trường THPT mục tiêu (Nguyện vọng 1):
            </label>
            <div className="relative">
              <School className="w-4 h-4 text-[#8A8A70] absolute left-3 top-3" />
              <input
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="Nhập tên trường THPT nguyện vọng 1..."
                className="w-full pl-9 pr-3 py-2 bg-[#FAF9F6] text-xs border border-[#EAE7E0] rounded-xl focus:ring-1 focus:ring-[#5A5A40] outline-hidden font-medium text-[#3D3D2D]"
                required
              />
            </div>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-[#8A8A70] mb-1.5">
              Gợi ý trường điểm cao:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {popularSchools.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSchool(s)}
                  className={`text-[10px] px-2.5 py-1 rounded-xl border transition cursor-pointer ${
                    school === s
                      ? 'bg-[#5A5A40] border-[#5A5A40] text-white font-bold'
                      : 'bg-[#FAF9F6] border-[#EAE7E0] text-[#6B6B54] hover:bg-[#E8E2D9]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 bg-[#FAF9F6] border border-[#D9D2C5] rounded-2xl text-xs text-[#5A5A40] flex items-start space-x-2">
            <Sparkles className="w-4 h-4 text-[#8BA888] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Hệ thống sẽ dựa vào mục tiêu <strong>{score} điểm</strong> để gợi ý bài tập tăng tốc
              phù hợp với năng lực của bạn!
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#6B6B54] hover:bg-[#FAF9F6] rounded-xl transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#5A5A40] hover:bg-[#3D3D2D] rounded-2xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Lưu Mục Tiêu</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
