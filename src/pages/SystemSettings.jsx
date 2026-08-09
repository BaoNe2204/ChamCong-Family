import React, { useState, useEffect } from 'react';
import { Settings, Save, MapPin, Clock, ArrowLeft, Loader2, Target, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SystemSettings() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };
  
  const [settings, setSettings] = useState({
    factoryLat: 10.762622,
    factoryLng: 106.660172,
    maxDistance: 500,
    wifiIp: '',
    requireWifi: false,
    otMultiplier: 1.5,
    minHoursForValidShift: 4
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await api.get('/settings/general');
      if (data) {
        setSettings({
          ...data,
          requireWifi: data.requireWifi === undefined ? (data.wifiIp ? true : false) : data.requireWifi,
          otMultiplier: data.otMultiplier || 1.5,
          minHoursForValidShift: data.minHoursForValidShift || 0
        });
      }
    } catch (error) {
      console.error("Lỗi khi tải cấu hình:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/settings/general', settings);
      showToast('Lưu cấu hình thành công!', 'success');
    } catch (error) {
      console.error("Lỗi khi lưu cấu hình:", error);
      showToast('Lỗi: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast("Trình duyệt không hỗ trợ GPS", "error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSettings(prev => ({
          ...prev,
          factoryLat: position.coords.latitude,
          factoryLng: position.coords.longitude
        }));
        showToast("Đã lấy vị trí GPS hiện tại", "success");
      },
      (error) => {
        showToast("Không thể lấy vị trí. Vui lòng cấp quyền GPS.", "error");
      },
      { enableHighAccuracy: true }
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 h-full">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">Đang tải cấu hình...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 font-sans selection:bg-indigo-100 selection:text-indigo-900 h-full overflow-y-auto">
      <div className="w-full space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-2">Cấu hình Hệ thống</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Thiết lập ca làm việc và tọa độ GPS cho toàn công ty.</p>
          </div>
          <button 
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-70 md:w-auto w-full"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Save className="w-5 h-5" />
            )}
            Lưu Cấu Hình
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* GPS Settings Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-sm border border-slate-200/60 dark:border-slate-800 p-6 md:p-8 flex flex-col hover:border-indigo-500/30 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">Vị trí Chấm Công (GPS)</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Tọa độ trung tâm (công ty).</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={getCurrentLocation}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 font-bold text-sm rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors shrink-0"
              >
                <Target className="w-4 h-4" />
                Lấy GPS hiện tại
              </button>
            </div>
            
            <div className="space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Vĩ độ (Lat)</label>
                  <input 
                    type="number" step="any"
                    value={settings.factoryLat}
                    onChange={(e) => setSettings({...settings, factoryLat: parseFloat(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-medium text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Kinh độ (Lng)</label>
                  <input 
                    type="number" step="any"
                    value={settings.factoryLng}
                    onChange={(e) => setSettings({...settings, factoryLng: parseFloat(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-medium text-slate-800 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Bán kính cho phép (mét)</label>
                <input 
                  type="number"
                  value={settings.maxDistance}
                  onChange={(e) => setSettings({...settings, maxDistance: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-medium text-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Network Settings Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-sm border border-slate-200/60 dark:border-slate-800 p-6 md:p-8 flex flex-col hover:border-indigo-500/30 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">Bảo mật Mạng (WiFi/LAN)</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Yêu cầu kết nối đúng mạng.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch('https://api.ipify.org?format=json');
                    const data = await res.json();
                    setSettings({...settings, wifiIp: data.ip});
                    showToast("Đã lấy IP hiện tại", "success");
                  } catch(e) {
                    showToast("Không thể lấy IP tự động. Vui lòng thử lại.", "error");
                  }
                }}
                className="flex items-center justify-center px-4 py-2 bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400 font-bold text-sm rounded-xl hover:bg-cyan-100 dark:hover:bg-cyan-500/20 transition-colors shrink-0"
              >
                Lấy IP hiện tại
              </button>
            </div>
            
            <div className="space-y-4 flex-1">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Bắt buộc kết nối WiFi/LAN</label>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Kiểm tra IP khi chấm công.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({...settings, requireWifi: !settings.requireWifi})}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ${settings.requireWifi ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings.requireWifi ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className={`transition-opacity ${settings.requireWifi ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Địa chỉ IP Công ty (Public IP)</label>
                <input 
                  type="text"
                  placeholder="VD: 14.161.42.11"
                  value={settings.wifiIp || ''}
                  onChange={(e) => setSettings({...settings, wifiIp: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none font-medium text-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Overtime Settings Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-sm border border-slate-200/60 dark:border-slate-800 p-6 md:p-8 flex flex-col hover:border-indigo-500/30 transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Hệ số Tăng Ca (OT)</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Mức nhân lương khi làm ngoài giờ.</p>
              </div>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Hệ số nhân (VD: 1.5, 2.0)</label>
              <input 
                type="number" step="0.1" min="1"
                value={settings.otMultiplier || 1.5}
                onChange={(e) => setSettings({...settings, otMultiplier: parseFloat(e.target.value)})}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none font-medium text-slate-800 dark:text-white"
              />
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Công thức: Lương tăng ca = Giờ tăng ca × Lương/Giờ × {settings.otMultiplier || 1.5}</p>
              </div>
            </div>
          </div>

          {/* Validation Settings Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-sm border border-slate-200/60 dark:border-slate-800 p-6 md:p-8 flex flex-col hover:border-indigo-500/30 transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Điều kiện Ca Hợp Lệ</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Giới hạn thời gian tối thiểu.</p>
              </div>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Thời gian tối thiểu (Giờ)</label>
              <input 
                type="number" step="0.1" min="0"
                value={settings.minHoursForValidShift === undefined ? '' : settings.minHoursForValidShift}
                onChange={(e) => setSettings({...settings, minHoursForValidShift: parseFloat(e.target.value)})}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none font-medium text-slate-800 dark:text-white"
              />
              <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-500/10 rounded-xl border border-purple-100 dark:border-purple-500/20">
                <p className="text-xs font-medium text-purple-700 dark:text-purple-400">Làm dưới {settings.minHoursForValidShift || 0} giờ sẽ bị hệ thống tự động đánh dấu là ca "Không hợp lệ".</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Custom Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 md:bottom-10 md:right-10 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 transform transition-all z-50 animate-[pulse_0.5s_ease-in-out_1] shadow-black/10 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          <p className="font-bold text-sm md:text-base">{toast.message}</p>
        </div>
      )}
    </div>
  );
}
