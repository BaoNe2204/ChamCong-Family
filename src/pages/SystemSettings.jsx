import React, { useState, useEffect } from 'react';
import { Settings, Save, MapPin, Clock, ArrowLeft, Loader2, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SystemSettings() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    factoryLat: 10.762622,
    factoryLng: 106.660172,
    maxDistance: 500,
    wifiIp: '',
    requireWifi: false,
    otMultiplier: 1.5
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
          otMultiplier: data.otMultiplier || 1.5
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
      alert('Lưu cấu hình thành công!');
    } catch (error) {
      console.error("Lỗi khi lưu cấu hình:", error);
      alert('Lỗi: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ GPS");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSettings(prev => ({
          ...prev,
          factoryLat: position.coords.latitude,
          factoryLng: position.coords.longitude
        }));
      },
      (error) => {
        alert("Không thể lấy vị trí. Vui lòng cấp quyền GPS.");
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
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-2">Cấu hình Hệ thống</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Thiết lập ca làm việc và tọa độ GPS cho toàn công ty.</p>
        </div>

        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-[28px] shadow-sm border border-slate-200/60 dark:border-slate-800 overflow-hidden">
          
          <div className="p-6 md:p-8 space-y-8">

            {/* GPS Settings */}
            <section>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Vị trí Chấm Công (GPS)</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Tọa độ trung tâm để nhân viên thực hiện check-in.</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={getCurrentLocation}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 font-bold text-sm rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                >
                  <Target className="w-4 h-4" />
                  Lấy vị trí hiện tại
                </button>
              </div>
              
              <div className="space-y-6 bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Vĩ độ (Latitude)</label>
                    <input 
                      type="number" 
                      step="any"
                      value={settings.factoryLat}
                      onChange={(e) => setSettings({...settings, factoryLat: parseFloat(e.target.value)})}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-medium text-slate-800 dark:text-white shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Kinh độ (Longitude)</label>
                    <input 
                      type="number" 
                      step="any"
                      value={settings.factoryLng}
                      onChange={(e) => setSettings({...settings, factoryLng: parseFloat(e.target.value)})}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-medium text-slate-800 dark:text-white shadow-sm"
                    />
                  </div>
                </div>
                
                <div className="pt-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Bán kính cho phép (mét)</label>
                  <input 
                    type="number"
                    value={settings.maxDistance}
                    onChange={(e) => setSettings({...settings, maxDistance: parseInt(e.target.value)})}
                    className="w-full md:w-1/2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-medium text-slate-800 dark:text-white shadow-sm"
                  />
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">Nhân viên phải đứng trong bán kính này tính từ tâm tọa độ trên để có thể Check In hợp lệ.</p>
                </div>
              </div>
            </section>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* Overtime Settings */}
            <section>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Cấu hình Tăng Ca (OT)</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Hệ số nhân lương cho số giờ làm việc ngoài ca.</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6 bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Hệ số Tăng Ca (Ví dụ: 1.5 hoặc 2)</label>
                  <input 
                    type="number"
                    step="0.1"
                    min="1"
                    value={settings.otMultiplier || 1.5}
                    onChange={(e) => setSettings({...settings, otMultiplier: parseFloat(e.target.value)})}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none font-medium text-slate-800 dark:text-white shadow-sm"
                  />
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">Lương tăng ca = Giờ tăng ca x Lương/Giờ x Hệ số này.</p>
                </div>
              </div>
            </section>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* Network Settings */}
            <section>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Bảo mật Mạng (WiFi/LAN)</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Yêu cầu nhân viên kết nối đúng mạng công ty để chấm công.</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch('https://api.ipify.org?format=json');
                      const data = await res.json();
                      setSettings({...settings, wifiIp: data.ip});
                    } catch(e) {
                      alert("Không thể lấy IP tự động. Vui lòng thử lại.");
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400 font-bold text-sm rounded-xl hover:bg-cyan-100 dark:hover:bg-cyan-500/20 transition-colors"
                >
                  Lấy IP mạng hiện tại
                </button>
              </div>
              
              <div className="space-y-6 bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Bật chức năng bắt buộc kết nối WiFi</label>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Khi bật, ứng dụng sẽ kiểm tra IP mạng của nhân viên.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({...settings, requireWifi: !settings.requireWifi})}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${settings.requireWifi ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
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
                    className="w-full md:w-1/2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none font-medium text-slate-800 dark:text-white shadow-sm"
                  />
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">Nhân viên phải kết nối vào mạng có IP này mới được phép Check-in.</p>
                </div>
              </div>
            </section>

          </div>

          {/* Footer */}
          <div className="p-6 md:p-8 bg-slate-50/80 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button 
              type="submit"
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
        </form>

      </div>
    </div>
  );
}
