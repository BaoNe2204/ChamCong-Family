import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileEdit, Clock, CalendarCheck, FileText, Send, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

const REQUEST_TYPES = [
  { id: 'ot', label: 'Tăng ca (OT)' },
  { id: 'late', label: 'Xin đi trễ' },
  { id: 'early', label: 'Xin về sớm' },
  { id: 'forgot_in', label: 'Quên Check-in' },
  { id: 'forgot_out', label: 'Quên Check-out' },
  { id: 'shift_change', label: 'Đổi ca' },
  { id: 'schedule_change', label: 'Đổi lịch làm' },
];

export default function EmployeeRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [type, setType] = useState('ot');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  
  // Dynamic fields
  const [time1, setTime1] = useState(''); // startTime, or time
  const [time2, setTime2] = useState(''); // endTime
  const [targetShift, setTargetShift] = useState(''); // for shift change
  const [targetDate, setTargetDate] = useState(''); // for schedule change

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const data = await api.get('/requests/my');
      setRequests(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!type || !date || !reason) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc!');
      return;
    }

    // Format final reason based on dynamic fields
    let finalReason = reason;
    if (type === 'ot' && time1 && time2) {
      finalReason = `Tăng ca từ ${time1} đến ${time2}. Lý do: ${reason}`;
    } else if ((type === 'late' || type === 'early' || type === 'forgot_in' || type === 'forgot_out') && time1) {
      finalReason = `Vào lúc ${time1}. Lý do: ${reason}`;
    } else if (type === 'shift_change' && targetShift) {
      finalReason = `Đổi sang ca: ${targetShift}. Lý do: ${reason}`;
    } else if (type === 'schedule_change' && targetDate) {
      finalReason = `Đổi sang ngày: ${targetDate}. Lý do: ${reason}`;
    }

    try {
      setLoading(true);
      await api.post('/requests', { type, date, reason: finalReason });
      alert('Gửi đơn thành công!');
      setDate('');
      setReason('');
      setTime1('');
      setTime2('');
      setTargetShift('');
      setTargetDate('');
      setIsModalOpen(false); // Close modal
      fetchMyRequests(); // Refresh list
    } catch (error) {
      alert('Có lỗi xảy ra: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold"><CheckCircle2 className="w-3 h-3"/> Đã duyệt</span>;
      case 'rejected':
        return <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold"><XCircle className="w-3 h-3"/> Từ chối</span>;
      default:
        return <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold"><AlertCircle className="w-3 h-3"/> Chờ duyệt</span>;
    }
  };

  return (
    <div className="w-full h-full p-4 md:p-6 text-slate-800 dark:text-white">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-50 rounded-xl border border-primary-200 text-primary-600 shadow-sm">
            <FileEdit className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Đơn từ & Yêu cầu</h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Quản lý và tạo các yêu cầu xin phép</p>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:from-primary-500 hover:to-indigo-500 transition-all hover:-translate-y-1"
        >
          <FileEdit className="w-5 h-5" />
          Tạo Đơn Mới
        </button>
      </div>
      
      {/* Main Content: My Requests */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-3xl border border-white/50 dark:border-white/10 rounded-[2rem] p-5 md:p-6 animate-[fadeIn_0.5s_ease-out] flex flex-col gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
         {/* Decorative blur inside card */}
         <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 blur-[100px] rounded-full pointer-events-none" />
         {loading ? (
           <div className="py-20 flex justify-center text-primary-500"><RefreshCw className="w-8 h-8 animate-spin" /></div>
         ) : requests.length === 0 ? (
           <div className="py-20 text-center text-slate-500 dark:text-slate-400 font-bold">Bạn chưa tạo đơn nào.</div>
         ) : (
           requests.map(req => {
             const typeObj = REQUEST_TYPES.find(t => t.id === req.type);
             const typeName = typeObj ? typeObj.label : req.type;
             
             return (
               <div key={req.id} className="relative z-10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-200 hover:bg-white/80 transition-all group shadow-sm hover:shadow-md">
                  <div className="flex gap-5 items-start">
                     <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 group-hover:from-blue-50 group-hover:to-indigo-50 group-hover:text-indigo-600 group-hover:border-blue-200 transition-colors shrink-0 shadow-sm">
                       <FileText className="w-6 h-6" />
                     </div>
                     <div>
                       <div className="flex items-center gap-3 mb-1">
                         <h3 className="font-black text-lg text-slate-800 dark:text-white">{typeName}</h3>
                         {getStatusBadge(req.status)}
                       </div>
                       <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                         <span className="flex items-center gap-1"><CalendarCheck className="w-3 h-3"/> Áp dụng: {new Date(req.date).toLocaleDateString('vi-VN')}</span>
                         <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> Tạo lúc: {new Date(req.createdAt).toLocaleDateString('vi-VN')}</span>
                       </div>
                       <p className="text-sm text-slate-600 dark:text-slate-300 italic border-l-2 border-slate-300 pl-3 py-1">"{req.reason}"</p>               <p className="text-sm text-slate-300 italic border-l-2 border-white/10 pl-3 py-1">"{req.reason}"</p>
                       
                       {req.adminNote && (
                         <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                           <p className="text-xs font-bold text-rose-400">Phản hồi từ Quản lý:</p>
                           <p className="text-sm text-rose-300">{req.adminNote}</p>
                         </div>
                       )}
                     </div>
                  </div>
               </div>
             );
           })
         )}
      </div>

      {/* Modal: New Request */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           {/* Backdrop - Lớp phủ xám mờ */}
           <div 
             className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" 
             onClick={() => setIsModalOpen(false)}
           />
           
           {/* Modal Content */}
           <div className="bg-white/90 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-6 md:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] relative w-full max-w-4xl z-10 overflow-hidden animate-[scaleIn_0.3s_ease-out]">
             {/* Decorative blur inside modal */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 blur-[80px] rounded-full pointer-events-none" />
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-400/10 blur-[80px] rounded-full pointer-events-none" />
             
             <div className="flex items-center justify-between mb-6 relative z-10">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                  <FileEdit className="w-6 h-6 text-indigo-600" /> Tạo Đơn Mới
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
             </div>

           <form onSubmit={handleSubmit} className="space-y-8 w-full relative z-10">
              
              {/* Type Select */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-500" /> Loại Đơn
                </label>
                <div className="flex flex-wrap gap-3">
                  {REQUEST_TYPES.map(t => (
                    <div 
                      key={t.id} 
                      onClick={() => setType(t.id)}
                      className={`cursor-pointer border rounded-2xl px-5 py-4 text-center transition-all duration-300 flex-1 min-w-[140px] ${type === t.id ? 'bg-primary-50 border-primary-300 text-primary-700 shadow-[0_4px_12px_rgba(99,102,241,0.1)] scale-[1.02]' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-300 hover:bg-white dark:bg-slate-800 hover:shadow-sm'}`}
                    >
                      <span className="font-bold text-sm">{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Fields based on Type */}
              <div className="flex flex-col md:flex-row gap-6">
                {/* Date Input (Always present) */}
                <div className="space-y-3 flex-1">
                  <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-primary-500" /> Ngày Áp Dụng
                  </label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-800 dark:text-white focus:outline-none focus:bg-white dark:bg-slate-800 focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-inner"
                  />
                </div>

                {/* OT Fields */}
                {type === 'ot' && (
                  <div className="space-y-3 flex-1 flex gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">Từ giờ</label>
                      <input type="time" required value={time1} onChange={e => setTime1(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-800 dark:text-white focus:outline-none focus:bg-white dark:bg-slate-800 focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-inner" />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">Đến giờ</label>
                      <input type="time" required value={time2} onChange={e => setTime2(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-800 dark:text-white focus:outline-none focus:bg-white dark:bg-slate-800 focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-inner" />
                    </div>
                  </div>
                )}

                {/* Single Time Fields */}
                {['late', 'early', 'forgot_in', 'forgot_out'].includes(type) && (
                  <div className="space-y-3 flex-1">
                    <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary-500" /> Thời gian cụ thể
                    </label>
                    <input type="time" required value={time1} onChange={e => setTime1(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-800 dark:text-white focus:outline-none focus:bg-white dark:bg-slate-800 focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-inner" />
                  </div>
                )}

                {/* Shift Change Fields */}
                {type === 'shift_change' && (
                  <div className="space-y-3 flex-1">
                    <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">Ca muốn đổi</label>
                    <select required value={targetShift} onChange={e => setTargetShift(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-800 dark:text-white focus:outline-none focus:bg-white dark:bg-slate-800 focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-inner appearance-none">
                      <option value="">-- Chọn ca --</option>
                      <option value="Ca Sáng">Ca Sáng</option>
                      <option value="Ca Chiều">Ca Chiều</option>
                      <option value="Ca Đêm">Ca Đêm</option>
                    </select>
                  </div>
                )}

                {/* Schedule Change Fields */}
                {type === 'schedule_change' && (
                  <div className="space-y-3 flex-1">
                    <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">Đổi sang ngày</label>
                    <input type="date" required value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-800 dark:text-white focus:outline-none focus:bg-white dark:bg-slate-800 focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-inner" />
                  </div>
                )}
              </div>

              {/* Reason Input */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-500" /> Chi Tiết / Lý Do
                </label>
                <textarea 
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  required
                  rows="3"
                  placeholder={type === 'ot' ? "Lý do tăng ca (VD: Dự án gấp...)" : "Nhập lý do chi tiết..."}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-800 dark:text-white focus:outline-none focus:bg-white dark:bg-slate-800 focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all resize-none shadow-inner"
                ></textarea>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                GỬI ĐƠN XIN PHÉP
              </button>
           </form>
         </div>
        </div>
      , document.body)}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}} />

    </div>
  );
}
