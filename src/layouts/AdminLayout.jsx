import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileEdit,
  History,
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  Clock,
  CalendarDays,
  DollarSign,
  ClipboardList,
  Moon,
  Sun,
  Zap
} from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';

export default function AdminLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, toggleDark] = useDarkMode();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Lỗi đăng xuất", error);
    }
  };

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Tổng quan' },
    { path: '/admin/requests', icon: FileEdit, label: 'Đơn từ' },
    { path: '/admin/employees', icon: Users, label: 'Nhân sự' },
    { path: '/admin/shifts', icon: Clock, label: 'Quản lý ca' },
    { path: '/admin/calendar', icon: CalendarDays, label: 'Lịch sử chấm công' },
    { path: '/admin/timesheet', icon: ClipboardList, label: 'Bảng Chấm Công' },
    { path: '/admin/overtime', icon: Zap, label: 'Quản lý tăng ca' },
    { path: '/admin/payroll', icon: DollarSign, label: 'Bảng Lương' },
    { path: '/admin/settings', icon: Settings, label: 'Cài đặt' },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center gap-4 border-b border-slate-200/60 dark:border-white/10">
        <div className="w-12 h-12 rounded-[14px] border-2 border-blue-600 p-0.5 shrink-0">
          <div className="w-full h-full bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm">
            {currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'A'}T
          </div>
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <h1 className="text-[15px] font-black text-slate-800 dark:text-white leading-tight line-clamp-1" title={currentUser?.fullName}>
            {currentUser?.fullName || 'Admin Tổng'}
          </h1>
          <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            QUẢN TRỊ VIÊN
          </p>
        </div>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-[12px] transition-all duration-300 ${isActive
                  ? 'border border-blue-600 text-blue-600 dark:text-blue-400 font-bold bg-transparent'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white border border-transparent font-semibold'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="font-bold text-sm">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-white/10 space-y-2">
        <button
          onClick={toggleDark}
          className="flex items-center justify-between px-4 py-3 w-full rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-all duration-300"
        >
          <div className="flex items-center gap-3 font-bold text-sm">
            {isDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
            <span>Giao diện {isDark ? 'Sáng' : 'Tối'}</span>
          </div>
          <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isDark ? 'bg-indigo-500' : 'bg-slate-300'}`}>
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isDark ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-300"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-bold text-sm">Đăng xuất</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f4f7fe] dark:bg-slate-950 flex text-slate-800 dark:text-slate-100 selection:bg-indigo-500/30 font-sans relative overflow-hidden transition-colors duration-500">

      {/* Background Decorators */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-400/20 blur-[120px] mix-blend-multiply pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-400/20 blur-[120px] mix-blend-multiply pointer-events-none" />
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 z-50 flex items-center justify-between px-4">
        <div className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg object-cover shadow-sm" />
          Admin Panel
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50" onClick={() => setIsMobileMenuOpen(false)}>
          <div
            className="absolute top-0 left-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/10 flex flex-col transform transition-transform shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-4 right-4 p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white z-50">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] bg-[#f4f7fe] dark:bg-slate-900/60 border-r border-slate-200/60 dark:border-slate-800 relative z-40 transition-colors duration-500">
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 flex flex-col h-screen overflow-y-auto pt-16 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
