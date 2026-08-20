import React, { useState } from 'react';
import {
  getCloudDBSettings,
  saveCloudDBSettings,
  fetchRoomDataFromOnlineDB,
  CloudDBSettings,
} from '../services/cloudSyncService';
import {
  Cloud,
  Database,
  RefreshCw,
  Copy,
  Check,
  X,
  Radio,
  Server,
  Key,
  ShieldCheck,
  ExternalLink,
  Sparkles,
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
              <h3 className="font-bold text-[#3D3D2D] text-base">Cấu Hình Cơ Sở Dữ Liệu Online</h3>
              <p className="text-[11px] text-[#8A8A70]">Đồng bộ dữ liệu của em qua Internet / Nhiều thiết bị</p>
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
              <p className="text-xs font-bold text-[#3D3D2D]">Trạng thái: Đang kết nối Cloud DB</p>
              <p className="text-[10px] text-[#8A8A70]">
                Đồng bộ lần cuối: {settings.lastSyncTimestamp ? new Date(settings.lastSyncTimestamp).toLocaleTimeString('vi-VN') : 'Vừa xong'}
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
              Mã Phòng Đồng Bộ Online (Shared Family/Class Room Key):
            </label>
            <p className="text-[11px] text-[#8A8A70]">
              Nhập cùng mã phòng này trên điện thoại/máy tính của em bạn để tự động kết nối chung 1 database.
            </p>
            <div className="flex space-x-2">
              <input
                type="text"
                value={settings.roomCode}
                onChange={(e) => setSettings({ ...settings, roomCode: e.target.value.toUpperCase() })}
                className="flex-1 px-3.5 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl font-mono font-bold text-[#3D3D2D] outline-hidden focus:border-[#5A5A40]"
                placeholder="VD: VAO10_EMTOI_8888"
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

          {/* Provider Selection */}
          <div className="space-y-1.5">
            <label className="block font-bold text-[#5A5A40]">Nhà cung cấp Database Online:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, provider: 'auto_cloud' })}
                className={`p-3 rounded-2xl border text-left font-bold transition cursor-pointer ${
                  settings.provider === 'auto_cloud'
                    ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-xs'
                    : 'bg-[#FAF9F6] text-[#6B6B54] border-[#EAE7E0]'
                }`}
              >
                <Cloud className="w-4 h-4 mb-1" />
                <p className="text-xs">Cloud Relay Tự Động</p>
                <p className="text-[10px] font-normal opacity-80">Miễn phí, 0ms, không cần cài đặt</p>
              </button>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, provider: 'firebase' })}
                className={`p-3 rounded-2xl border text-left font-bold transition cursor-pointer ${
                  settings.provider === 'firebase'
                    ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-xs'
                    : 'bg-[#FAF9F6] text-[#6B6B54] border-[#EAE7E0]'
                }`}
              >
                <Server className="w-4 h-4 mb-1" />
                <p className="text-xs">Firebase Realtime DB</p>
                <p className="text-[10px] font-normal opacity-80">Tùy biến cho Server riêng</p>
              </button>
            </div>
          </div>

          {/* Firebase Custom Endpoint */}
          {settings.provider === 'firebase' && (
            <div className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-[#D9D2C5] space-y-2 animate-in fade-in">
              <label className="block font-bold text-[#5A5A40]">Firebase Realtime Database URL:</label>
              <input
                type="url"
                value={settings.customEndpoint || ''}
                onChange={(e) => setSettings({ ...settings, customEndpoint: e.target.value })}
                placeholder="https://your-project-default-rtdb.firebaseio.com"
                className="w-full px-3 py-2 bg-white border border-[#EAE7E0] rounded-xl outline-hidden text-xs"
              />
              <p className="text-[10px] text-[#8A8A70]">
                Nhập link Firebase RTDB của bạn. Ứng dụng sẽ tự động lưu và đọc dữ liệu qua REST API chuẩn.
              </p>
            </div>
          )}

          {/* Auto-Sync Interval */}
          <div className="space-y-1">
            <label className="block font-bold text-[#5A5A40]">Tần suất tự động quét kết quả mới từ Online DB:</label>
            <select
              value={settings.autoSyncIntervalSec}
              onChange={(e) => setSettings({ ...settings, autoSyncIntervalSec: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden text-xs cursor-pointer font-bold text-[#3D3D2D]"
            >
              <option value={5}>Mỗi 5 giây (Thời gian thực siêu nhanh)</option>
              <option value={15}>Mỗi 15 giây (Khuyên dùng)</option>
              <option value={30}>Mỗi 30 giây</option>
              <option value={60}>Mỗi 1 phút</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-[#F5F2ED]">
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
        </form>
      </div>
    </div>
  );
};
