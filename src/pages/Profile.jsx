import React, { useState } from 'react';
import { ArrowLeft, User, Phone, Mail, Lock, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { db } from '../firebase';

export default function Profile() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsUpdating(true);
    setMessage({ type: '', text: '' });

    try {
      // 1. Update Firestore Profile
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        fullName,
        phone
      });

      // 2. Update Password if provided
      if (newPassword.trim().length >= 6) {
        await updatePassword(currentUser, newPassword);
      }

      setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công!' });
      setNewPassword(''); // clear password field
    } catch (error) {
      console.error("Lỗi cập nhật hồ sơ:", error);
      setMessage({ type: 'error', text: 'Lỗi: ' + error.message });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Hồ sơ cá nhân</h1>
            <p className="text-slate-500 dark:text-slate-400">Quản lý thông tin tài khoản của bạn</p>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          
          {/* Avatar Section */}
          <div className="p-8 flex flex-col items-center justify-center border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shadow-lg border-4 border-white dark:border-slate-800 mb-4">
              <img src={`https://ui-avatars.com/api/?name=${currentUser?.email}&background=random&size=128`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{currentUser?.fullName || currentUser?.email}</h2>
            <div className="flex items-center gap-1.5 mt-2 text-sm">
               <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium ${
                 currentUser?.role === 'admin' 
                   ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' 
                   : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
               }`}>
                 {currentUser?.role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                 {currentUser?.role === 'admin' ? 'Quản lý (Admin)' : 'Nhân viên'}
               </span>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleUpdateProfile} className="p-6 sm:p-8 space-y-6">
            
            {message.text && (
              <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                {message.text}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  <Mail className="w-4 h-4 text-slate-400" />
                  Email đăng nhập
                </label>
                <input 
                  type="email" 
                  disabled
                  value={currentUser?.email || ''}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1.5">Email không thể thay đổi. Vui lòng liên hệ quản lý nếu cần đổi.</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  Họ và tên
                </label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  placeholder="Nhập họ và tên..."
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  <Phone className="w-4 h-4 text-slate-400" />
                  Số điện thoại
                </label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  placeholder="Nhập số điện thoại liên hệ..."
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  <Lock className="w-4 h-4 text-slate-400" />
                  Đổi mật khẩu mới (Tùy chọn)
                </label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  placeholder="Để trống nếu không muốn đổi"
                />
                <p className="text-xs text-slate-500 mt-1.5">Mật khẩu mới phải có ít nhất 6 ký tự.</p>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isUpdating}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {isUpdating ? 'Đang cập nhật...' : 'Lưu Thay Đổi'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
