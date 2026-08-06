import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar as CalendarIcon, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function AttendanceHistory() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchHistory();
  }, [currentUser, selectedMonth, selectedYear]);

  const fetchHistory = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const attendanceRef = collection(db, 'attendance');
      
      // Calculate start and end date for the selected month
      const startStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const endStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-31`; // Note: String comp works fine with 31 even for shorter months

      const q = query(
        attendanceRef,
        where('userId', '==', currentUser.uid),
        where('date', '>=', startStr),
        where('date', '<=', endStr),
        orderBy('date', 'desc')
      );
      
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(data);
    } catch (error) {
      console.error("Lỗi lấy lịch sử:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestampMillis) => {
    if (!timestampMillis) return '--:--';
    return new Date(timestampMillis).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Lịch sử Điểm danh</h1>
              <p className="text-slate-500 dark:text-slate-400">Xem lại dữ liệu làm việc của bạn</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium outline-none focus:ring-2 focus:ring-primary-500"
            >
              {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium outline-none focus:ring-2 focus:ring-primary-500"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vào ca</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tan ca</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng giờ</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">Đang tải dữ liệu...</td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">Không có dữ liệu chấm công tháng này.</td>
                  </tr>
                ) : (
                  history.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                          <CalendarIcon className="w-4 h-4 text-slate-400" />
                          {record.date}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                          <Clock className="w-4 h-4" />
                          {formatTime(record.checkInTimeMillis)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                          <Clock className="w-4 h-4" />
                          {formatTime(record.checkOutTimeMillis)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-700 dark:text-slate-300">
                        {record.totalHours ? `${record.totalHours}h` : '--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.isValidShift ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            Hợp lệ
                          </span>
                        ) : record.checkOutTimeMillis ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            <XCircle className="w-3 h-3" />
                            Thiếu giờ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                            Đang làm
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
