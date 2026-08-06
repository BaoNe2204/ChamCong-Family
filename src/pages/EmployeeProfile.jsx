import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Shield, Edit2, Save, X, Camera, Star, Award, MapPin } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function EmployeeProfile() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', phone: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await api.get('/auth/me');
      setProfile(data);
      setFormData({ fullName: data.fullName || '', phone: data.phone || '' });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put('/users/profile', formData);
      setProfile({ ...profile, ...formData });
      setIsEditing(false);
      alert('Cập nhật hồ sơ thành công!');
    } catch (error) {
      alert(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return <div className="w-full h-full flex justify-center items-center">
      <span className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></span>
    </div>;
  }

  return (
    <div className="w-full h-full p-4 md:p-6 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-500 overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-500/20 dark:to-blue-500/20 rounded-2xl border border-indigo-200/50 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 shadow-sm">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800 dark:text-white">Hồ sơ cá nhân</h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-0.5">Quản lý thông tin và tài khoản của bạn</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar relative z-10">
        <div className="max-w-5xl mx-auto space-y-6 animate-[fadeIn_0.5s_ease-out]">
          
          {/* Cover & Avatar Card */}
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-3xl border border-white/50 dark:border-white/10 shadow-xl shadow-slate-200/40 dark:shadow-black/20 rounded-[2.5rem] overflow-hidden relative group">
            
            {/* Cover Image / Gradient */}
            <div className="h-28 md:h-36 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            </div>

            <div className="px-6 md:px-10 pb-8 relative">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-5 -mt-14 md:-mt-16 mb-4">
                
                {/* Avatar */}
                <div className="relative group/avatar">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-xl bg-white dark:bg-slate-700 overflow-hidden shrink-0 relative z-10">
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName || 'User')}&background=4f46e5&color=fff&size=256&font-size=0.33&bold=true`} alt="Avatar" className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-105" />
                  </div>
                  <button className="absolute bottom-0 right-0 md:bottom-1 md:right-1 w-8 h-8 md:w-9 md:h-9 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800 hover:bg-indigo-700 transition-colors z-20 cursor-pointer">
                    <Camera className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                </div>

                {/* Name & Role */}
                <div className="text-center md:text-left flex-1 pb-1 md:pb-2">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">{profile.fullName || 'Người dùng'}</h2>
                    {profile.role === 'admin' && <Shield className="w-5 h-5 text-amber-500 fill-amber-500/20" />}
                  </div>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-sm font-bold mt-1.5">
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-500/20 uppercase tracking-widest text-xs flex items-center gap-1.5">
                      <Star className="w-3 h-3" />
                      {profile.role === 'admin' ? 'Quản lý' : 'Nhân viên'}
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <MapPin className="w-4 h-4" /> TP. Hồ Chí Minh
                    </span>
                  </div>
                </div>

                {/* Edit Button */}
                {!isEditing && (
                  <div className="pb-1 md:pb-2">
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 text-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                      Sửa hồ sơ
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-full">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-3xl border border-white/50 dark:border-white/10 shadow-xl shadow-slate-200/40 dark:shadow-black/20 rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden h-full group hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/30 transition-all duration-500">
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-400/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-indigo-400/20 transition-colors duration-700" />
                
                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3 mb-8">
                  <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-xl">
                    <Shield className="w-5 h-5" />
                  </div>
                  Thông tin liên hệ
                </h3>

                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-6 relative z-10 animate-[fadeIn_0.3s_ease-out]">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Họ và tên</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className="w-5 h-5 text-slate-400" />
                        </div>
                        <input 
                          type="text" 
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-white transition-all shadow-inner"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Số điện thoại</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Phone className="w-5 h-5 text-slate-400" />
                        </div>
                        <input 
                          type="tel" 
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          placeholder="VD: 0912345678"
                          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-white transition-all shadow-inner"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-slate-400 dark:text-slate-500 ml-1">Email <span className="text-xs font-medium text-slate-400 normal-case">(Không thể thay đổi)</span></label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Mail className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                        </div>
                        <input 
                          type="email" 
                          value={profile.email}
                          disabled
                          className="w-full bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold text-slate-400 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-white/10 mt-8">
                      <button 
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({ fullName: profile.fullName || '', phone: profile.phone || '' });
                        }}
                        className="w-full sm:w-auto flex justify-center items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-bold px-8 py-4 rounded-2xl transition-colors"
                      >
                        <X className="w-5 h-5" />
                        Hủy
                      </button>
                      <button 
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto flex justify-center items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold px-10 py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/30 active:scale-[0.98] disabled:opacity-50"
                      >
                        {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <Save className="w-5 h-5" />}
                        Lưu thông tin
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center p-5 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow group/item">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mr-5 group-hover/item:scale-110 transition-transform">
                        <User className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">Họ và tên</p>
                        <p className="text-lg font-bold text-slate-800 dark:text-white">{profile.fullName || 'Chưa cập nhật'}</p>
                      </div>
                    </div>

                    <div className="flex items-center p-5 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow group/item">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mr-5 group-hover/item:scale-110 transition-transform">
                        <Phone className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">Số điện thoại</p>
                        <p className="text-lg font-bold text-slate-800 dark:text-white">{profile.phone || 'Chưa cập nhật'}</p>
                      </div>
                    </div>

                    <div className="flex items-center p-5 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow group/item">
                      <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mr-5 group-hover/item:scale-110 transition-transform">
                        <Mail className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">Email liên hệ</p>
                        <p className="text-lg font-bold text-slate-800 dark:text-white">{profile.email}</p>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.3);
          border-radius: 20px;
        }
      `}} />
    </div>
  );
}
