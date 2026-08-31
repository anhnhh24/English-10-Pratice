import React, { useState } from 'react';
import {
  getCloudDBSettings,
  saveCloudDBSettings,
  fetchRoomDataFromOnlineDB,
  clearLocalCachesAndHardReset,
  CloudDBSettings,
} from '../../services/cloudSyncService';
import {
  Cloud,
  Database,
  RefreshCw,
  Copy,
  Check,
  X,
  Laptop,
  Radio,
  Server,
  Key,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Info,
} from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncCompleted?: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncCompleted,
}) => {
  const [settings, setSettings] = useState<CloudDBSettings>(() => getCloudDBSettings());
  const [copied, setCopied] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(settings.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveCloudDBSettings(settings);
    setSettings(updated);
    setSyncStatusMsg('Đã lưu cấu hình DB Online thành công!');
    setTimeout(() => setSyncStatusMsg(null), 3000);
  };

  const handleManualSyncNow = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const res = await fetchRoomDataFromOnlineDB();
      setSyncStatusMsg(res.message);
      if (onSyncCompleted) onSyncCompleted();
    } catch (err: any) {
      setSyncStatusMsg('Lỗi kết nối DB Online');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-[2.5rem] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#EAE7E0] space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0]">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#5A5A40] text-white flex items-center justify-center font-bold shadow-xs">
              <Database className="w-5 h-5 text-[#8BA888]" />
            </div>
            <div>
              <h3 className="font-bold text-[#3D3D2D] text-base">Đồng Bộ Đám Mây Đa Thiết Bị (Multi-Device)</h3>
              <p className="text-[11px] text-[#8A8A70]">Tự động đồng bộ thời gian thực giữa 2 máy / nhiều thiết bị</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#8A8A70] hover:text-[#3D3D2D] rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Badge */}
        <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#D9D2C5] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#3D3D2D]">Trạng thái: Realtime Cloud DB Kết Nối</p>
              <p className="text-[10px] text-[#8A8A70]">
                Mã phòng: <span className="font-mono font-bold text-[#5A5A40]">{settings.roomCode}</span> • {settings.lastSyncTimestamp ? new Date(settings.lastSyncTimestamp).toLocaleTimeString('vi-VN') : 'Vừa xong'}
              </p>
            </div>
          </div>

          <button
            onClick={handleManualSyncNow}
            disabled={isSyncing}
            className="px-3.5 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Đang tải...' : 'Đồng bộ ngay'}</span>
          </button>
        </div>

        {/* Multi-Device Explanation Banner */}
        <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-blue-900 leading-relaxed">
            <p className="font-bold">Cơ chế chống lệch dữ liệu giữa 2 máy:</p>
            <p className="text-blue-700 mt-0.5">
              Hệ thống đã kích hoạt cơ chế <strong>hợp nhất dữ liệu thông minh (Smart Non-Destructive Merge)</strong> và <strong>kênh nghe thời gian thực (Live Firebase Subscriptions)</strong>. Mọi bài thi, sổ tay lỗi sai, câu hỏi tự tạo và tài khoản đăng ký trên máy này sẽ tự động cập nhật ngay sang máy kia mà không bị ghi đè hay mất dữ liệu do cache/cookie cũ.
            </p>
          </div>
        </div>

        {syncStatusMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-1.5">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncStatusMsg}</span>
          </div>
        )}

        {/* Settings Form */}
        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          {/* Room Key Box */}
          <div className="space-y-1.5">
            <label className="block font-bold text-[#5A5A40]">
              Mã Phòng Đồng Bộ (Shared Room Key):
            </label>
            <p className="text-[11px] text-[#8A8A70]">
              Cả 2 máy chỉ cần nhập <strong>cùng mã phòng này</strong> là sẽ tự động kết nối và đồng bộ 100% dữ liệu với nhau.
            </p>
            <div className="flex space-x-2">
              <input
                type="text"
                value={settings.roomCode}
                onChange={(e) => setSettings({ ...settings, roomCode: e.target.value.toUpperCase() })}
                className="flex-1 px-3.5 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl font-mono font-bold text-[#3D3D2D] outline-hidden focus:border-[#5A5A40]"
                placeholder="VD: VAO10_GIAMSAT_2026"
                required
              />
              <button
                type="button"
                onClick={handleCopyRoomCode}
                className="px-3.5 py-2 bg-[#FAF9F6] hover:bg-[#E8E2D9] border border-[#D9D2C5] text-[#5A5A40] rounded-xl font-bold transition flex items-center space-x-1 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>
          </div>

          {/* Danger Zone: Clean Cache Button */}
          <div className="pt-2 border-t border-[#F5F2ED] flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (confirm('Bạn có chắc muốn xóa sạch toàn bộ bộ nhớ đệm (Cache/Cookie) trên máy này và tải dữ liệu mới nhất 100% từ Database Online về?')) {
                  clearLocalCachesAndHardReset();
                  window.location.reload();
                }
              }}
              className="text-[11px] text-red-600 hover:text-red-700 font-bold underline cursor-pointer"
            >
              🧹 Xóa sạch Cache/Cookie máy này & Tải lại từ Cloud
            </button>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#FAF9F6] hover:bg-[#E8E2D9] text-[#6B6B54] rounded-xl font-bold transition cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl font-bold shadow-xs transition cursor-pointer"
              >
                Lưu cài đặt
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
