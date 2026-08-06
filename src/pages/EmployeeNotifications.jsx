import React from 'react';
import { Bell } from 'lucide-react';

export default function EmployeeNotifications() {
  return (
    <div className="w-full h-full p-4 md:p-6 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-500/20 dark:to-blue-500/20 rounded-2xl border border-indigo-200/50 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 shadow-sm">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800 dark:text-white">Thông báo</h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-0.5">Cập nhật tin tức công ty và trạng thái duyệt đơn</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center animate-[fadeIn_0.5s_ease-out]">
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-3xl border border-white/50 dark:border-white/10 shadow-xl shadow-slate-200/40 dark:shadow-black/20 rounded-[2.5rem] p-12 max-w-lg w-full flex flex-col items-center group hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/30 transition-all duration-500">
           <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-300">
             <Bell className="w-10 h-10" />
           </div>
           <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-2">Coming Soon</h2>
           <p className="text-slate-500 dark:text-slate-400 font-bold">Tính năng này đang được phát triển và sẽ sớm ra mắt.</p>
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
