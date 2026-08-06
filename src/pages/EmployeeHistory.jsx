import React, { useState, useEffect } from 'react';
import { History, Calendar, Clock, MapPin, CheckCircle2, AlertTriangle, Fingerprint } from 'lucide-react';
import { api } from '../services/api';

export default function EmployeeHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await api.get('/attendance/history');
      setHistory(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (record) => {
    if (!record.checkOutTimeMillis) return { text: 'Đang làm việc', color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10' };
    if (record.isValidShift) return { text: 'Hợp lệ', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200' };
    return { text: 'Thiếu giờ', color: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-200' };
  };

  return (
    <div className="w-full h-full p-4 md:p-6 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-50 dark:bg-violet-500/10 rounded-xl border border-violet-200 dark:border-violet-500/20 text-violet-600 shadow-sm">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Lịch sử</h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Xem lại toàn bộ lịch sử hoạt động</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pb-10">
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-3xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 lg:p-8 min-h-full">
          
          {loading ? (
             <div className="flex justify-center items-center h-40">
               <span className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></span>
             </div>
          ) : history.length === 0 ? (
             <div className="flex flex-col items-center justify-center text-center h-64 text-slate-400">
                <History className="w-16 h-16 mb-4 opacity-20" />
                <h3 className="text-lg font-black text-slate-600 dark:text-slate-300">Chưa có dữ liệu</h3>
                <p className="font-semibold text-sm">Bạn chưa có lịch sử chấm công nào.</p>
             </div>
          ) : (
            <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
               {history.map((record) => {
                 const status = getStatus(record);
                 return (
                   <div key={record.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
                     
                     <div className="flex items-start gap-4 mb-4 md:mb-0">
                       <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col items-center justify-center shrink-0">
                         <span className="text-sm font-black text-slate-800 dark:text-white leading-none">{new Date(record.date).getDate()}</span>
                         <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">Th{new Date(record.date).getMonth()+1}</span>
                       </div>
                       
                       <div>
                         <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                           {new Date(record.date).toLocaleDateString('vi-VN', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
                           <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-widest font-bold border ${status.color}`}>
                             {status.text}
                           </span>
                         </h3>
                         <div className="flex items-center gap-5 mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                           <span className="flex items-center gap-1.5"><Fingerprint className="w-4 h-4 text-emerald-500" /> VÀO: {new Date(record.checkInTimeMillis).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</span>
                           <span className="flex items-center gap-1.5"><Fingerprint className="w-4 h-4 text-rose-500" /> RA: {record.checkOutTimeMillis ? new Date(record.checkOutTimeMillis).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'}) : '--:--'}</span>
                         </div>
                       </div>
                     </div>
                     
                     <div className="flex items-center gap-6 md:justify-end border-t md:border-t-0 border-slate-200 dark:border-white/10 pt-4 md:pt-0">
                       <div className="text-left md:text-right">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tổng giờ làm</p>
                         <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{record.totalHours ? record.totalHours + 'h' : '--'}</p>
                       </div>
                     </div>

                   </div>
                 )
               })}
            </div>
          )}

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
