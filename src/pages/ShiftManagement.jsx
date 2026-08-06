import React, { useState, useEffect } from 'react';
import { Settings, Save, MapPin, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function ShiftManagement() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    shiftStart: '08:00',
    shiftEnd: '17:00',
    factoryLat: 10.762622,
    factoryLng: 106.660172,
    maxDistance: 500
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'settings', 'general');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings(docSnap.data());
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
      await setDoc(doc(db, 'settings', 'general'), settings);
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
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin')}
            className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Cấu hình Hệ thống</h1>
            <p className="text-slate-500 dark:text-slate-400">Thiết lập ca làm việc và vị trí GPS</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          
          <div className="p-6 sm:p-8 space-y-8">
            
            {/* Shift Settings */}
            <section>
              <h3 className="flex items-center gap-2 font-bold text-lg text-slate-800 dark:text-white mb-4">
                <Clock className="w-5 h-5 text-primary-500" />
                Ca Làm Việc (Mặc định)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Giờ bắt đầu (Check In)</label>
                  <input 
                    type="time" 
                    value={settings.shiftStart}
                    onChange={(e) => setSettings({...settings, shiftStart: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Giờ kết thúc (Check Out)</label>
                  <input 
                    type="time" 
                    value={settings.shiftEnd}
                    onChange={(e) => setSettings({...settings, shiftEnd: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>
            </section>

            {/* GPS Settings */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2 font-bold text-lg text-slate-800 dark:text-white">
                  <MapPin className="w-5 h-5 text-emerald-500" />
                  Vị trí Chấm Công (GPS)
                </h3>
                <button 
                  type="button"
                  onClick={getCurrentLocation}
                  className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Lấy vị trí hiện tại
                </button>
              </div>
              
              <div className="space-y-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Vĩ độ (Latitude)</label>
                    <input 
                      type="number" 
                      step="any"
                      value={settings.factoryLat}
                      onChange={(e) => setSettings({...settings, factoryLat: parseFloat(e.target.value)})}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Kinh độ (Longitude)</label>
                    <input 
                      type="number" 
                      step="any"
                      value={settings.factoryLng}
                      onChange={(e) => setSettings({...settings, factoryLng: parseFloat(e.target.value)})}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bán kính cho phép (mét)</label>
                  <input 
                    type="number"
                    value={settings.maxDistance}
                    onChange={(e) => setSettings({...settings, maxDistance: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-2">Nhân viên phải đứng trong bán kính này tính từ tâm tọa độ trên để có thể Check In.</p>
                </div>
              </div>
            </section>

          </div>

          {/* Footer */}
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
            <button 
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-70"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Lưu cấu hình
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
