import React, { useState, useEffect } from 'react';
import { Settings, Moon, Sun, Globe, Bell, Shield, Key, Smartphone } from 'lucide-react';
import { api } from '../services/api';

export default function EmployeeSettings() {
  // Load initial states from localStorage if available
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'light');
  const [language, setLanguage] = useState(() => localStorage.getItem('app_language') || 'vi');
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('app_notifications');
    return saved ? JSON.parse(saved) : { push: true, email: false };
  });
  
  const [twoFactor, setTwoFactor] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [loadingPass, setLoadingPass] = useState(false);

  // Save to localStorage when they change
  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    // Apply theme class to HTML element for future full dark mode support
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('app_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      alert("Mật khẩu mới không khớp!");
      return;
    }
    
    if (passwordForm.new.length < 6) {
      alert("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    try {
      setLoadingPass(true);
      await api.put('/users/change-password', {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.new
      });
      alert("Đổi mật khẩu thành công! Vui lòng sử dụng mật khẩu mới cho lần đăng nhập sau.");
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (error) {
      alert(error.message || "Đổi mật khẩu thất bại, vui lòng kiểm tra lại mật khẩu hiện tại!");
    } finally {
      setLoadingPass(false);
    }
  };

  return (
    <div className="w-full h-full p-4 md:p-6 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 shadow-sm">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Cài đặt</h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Tuỳ chỉnh ứng dụng và bảo mật</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
          
          {/* Tuỳ chỉnh ứng dụng */}
          <div className="flex flex-col gap-4 animate-[fadeIn_0.4s_ease-out]">
            <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 px-1">
              <Settings className="w-5 h-5 text-indigo-500" />
              Tuỳ chỉnh ứng dụng
            </h2>
            
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-3xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/10 blur-[80px] rounded-full pointer-events-none" />
              
              {/* Theme */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 shadow-sm border border-orange-100 dark:border-orange-500/20">
                    {theme === 'light' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-base">Giao diện</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">Sáng / Tối</p>
                  </div>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl shadow-inner border border-transparent dark:border-white/5">
                  <button 
                    onClick={() => setTheme('light')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${theme === 'light' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white scale-100' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 scale-95'}`}
                  >Sáng</button>
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${theme === 'dark' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white scale-100' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 scale-95'}`}
                  >Tối</button>
                </div>
              </div>

              <hr className="border-slate-200/60 dark:border-white/10 relative z-10" />

              {/* Language */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 shadow-sm border border-blue-100 dark:border-blue-500/20">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-base">Ngôn ngữ</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">Tiếng Việt / English</p>
                  </div>
                </div>
                <select 
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-sm rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none min-w-[130px] cursor-pointer shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </div>

              <hr className="border-slate-200/60 dark:border-white/10 relative z-10" />

              {/* Notifications */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 shadow-sm border border-rose-100 dark:border-rose-500/20">
                    <Bell className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-base">Thông báo đẩy</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">Nhận thông báo qua trình duyệt</p>
                  </div>
                </div>
                <button 
                  onClick={() => setNotifications({...notifications, push: !notifications.push})}
                  className={`w-12 h-7 rounded-full transition-colors relative shadow-inner cursor-pointer ${notifications.push ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all shadow-sm ${notifications.push ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Bảo mật */}
          <div className="flex flex-col gap-4 animate-[fadeIn_0.5s_ease-out]">
            <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 px-1">
              <Shield className="w-5 h-5 text-emerald-500" />
              Bảo mật tài khoản
            </h2>
            
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-3xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden h-full">
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/10 blur-[80px] rounded-full pointer-events-none" />

              {/* 2FA */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 flex items-center justify-center shrink-0 shadow-sm border border-emerald-100 dark:border-emerald-500/20">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-base">Xác thực 2 lớp (2FA)</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">Tăng cường bảo mật đăng nhập</p>
                  </div>
                </div>
                <button 
                  onClick={() => setTwoFactor(!twoFactor)}
                  className={`w-12 h-7 rounded-full transition-colors relative shadow-inner cursor-pointer ${twoFactor ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all shadow-sm ${twoFactor ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <hr className="border-slate-200/60 dark:border-white/10 relative z-10" />

              {/* Change Password */}
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 shadow-sm border border-slate-200 dark:border-white/10">
                    <Key className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-base">Đổi mật khẩu</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">Cập nhật mật khẩu mới thường xuyên</p>
                  </div>
                </div>

                <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
                  <input 
                    type="password" 
                    placeholder="Mật khẩu hiện tại" 
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
                    required
                    className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner text-slate-800 dark:text-white placeholder:text-slate-400"
                  />
                  <input 
                    type="password" 
                    placeholder="Mật khẩu mới" 
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                    required
                    className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner text-slate-800 dark:text-white placeholder:text-slate-400"
                  />
                  <input 
                    type="password" 
                    placeholder="Nhập lại mật khẩu mới" 
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                    required
                    className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner text-slate-800 dark:text-white placeholder:text-slate-400"
                  />
                  <button 
                    type="submit"
                    disabled={loadingPass}
                    className="mt-3 w-full bg-slate-800 dark:bg-indigo-600 hover:bg-slate-700 dark:hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-slate-800/20 dark:shadow-indigo-500/20 hover:shadow-slate-800/40 dark:hover:shadow-indigo-500/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  >
                    {loadingPass ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : null}
                    Cập nhật mật khẩu
                  </button>
                </form>
              </div>

            </div>
          </div>
          
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
