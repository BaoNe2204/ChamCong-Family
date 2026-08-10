import React, { useState, useEffect, useMemo } from 'react';
import { Users, FileDown, Search, ArrowLeft, Settings, CheckCircle2, XCircle, Clock, FileText, TrendingUp, Calendar, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [stats, setStats] = useState({
    totalUsers: 0,
    workingToday: 0,
    lateToday: 0
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedMonth, selectedYear]);

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      // Fetch users
      const usersData = await api.get('/users');
      setUsers(usersData);
      
      // Fetch attendance
      const startStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const endStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-31`;
      
      const attData = await api.get(`/admin/attendance?startStr=${startStr}&endStr=${endStr}`);
      setAttendance(attData);
      
      // Calculate Stats
      const today = new Date();
      // adjust for VN timezone simply
      const todayStr = new Date(today.getTime() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const todayRecords = attData.filter(r => r.date === todayStr);
      const lateRecords = todayRecords.filter(r => r.status === 'LATE' || r.late_minutes > 0);

      setStats({
        totalUsers: usersData.length,
        workingToday: todayRecords.length,
        lateToday: lateRecords.length
      });
      
    } catch (error) {
      console.error("Lỗi fetch dữ liệu: ", error);
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeName = (email) => {
    const user = users.find(u => u.email === email);
    return user?.fullName || email;
  };

  const formatTime = (millis) => {
    if (!millis) return '--:--';
    return new Date(Number(millis)).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
  };

  const filteredData = attendance.filter(record => {
    const name = getEmployeeName(record.userName).toLowerCase();
    const email = (record.userName || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search) || email.includes(search);
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedMonth, selectedYear]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportCSV = () => {
    const headers = ["Ngày", "Họ Tên", "Email", "Vào ca", "Tan ca", "Tổng giờ", "Đi trễ (phút)", "Về sớm (phút)", "OT (giờ)", "Trạng thái"];
    const rows = filteredData.map(record => {
      const checkIn = formatTime(record.checkInTimeMillis);
      const checkOut = formatTime(record.checkOutTimeMillis);
      let statusStr = "Đang làm";
      if (record.checkOutTimeMillis) {
        if (record.status === 'LATE') statusStr = "Đi trễ";
        else if (record.status === 'EARLY_LEAVE') statusStr = "Về sớm";
        else if (record.status === 'OT') statusStr = "Tăng ca";
        else statusStr = "Đúng giờ";
      }
      return [
        record.date, 
        `"${getEmployeeName(record.userName)}"`,
        record.userName,
        checkIn, 
        checkOut, 
        record.totalHours || 0,
        record.late_minutes || 0,
        record.early_leave_minutes || 0,
        record.overtime_hours || 0,
        statusStr
      ];
    });
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BangCong_T${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-4 md:p-8 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      <div className="w-full space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="group w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm border border-slate-200/60 dark:border-slate-800 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 dark:text-slate-400 dark:group-hover:text-indigo-400 transition-colors" />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">
                Tổng Quan
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                Giám sát và quản lý nhân sự toàn hệ thống
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={handleExportCSV}
              disabled={filteredData.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              <FileDown className="w-5 h-5" />
              Xuất Excel
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stat Card 1 */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Users className="w-24 h-24 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Tổng số nhân sự</p>
              <h3 className="text-4xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalUsers}</h3>
            </div>
          </div>

          {/* Stat Card 2 */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <TrendingUp className="w-24 h-24 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Đang làm việc hôm nay</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-4xl font-bold text-slate-900 dark:text-white">{stats.workingToday}</h3>
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">/{stats.totalUsers}</span>
              </div>
            </div>
          </div>

          {/* Stat Card 3 */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <AlertCircle className="w-24 h-24 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Vắng / Đi trễ</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-4xl font-bold text-slate-900 dark:text-white">{Math.max(0, stats.totalUsers - stats.workingToday)}</h3>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">vắng</span>
                <span className="text-sm font-medium text-rose-500 mx-1">•</span>
                <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.lateToday}</h3>
                <span className="text-sm font-medium text-rose-500/80">trễ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Table Area */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 overflow-hidden">
          
          <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-900/20">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="pl-9 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow appearance-none cursor-pointer"
                >
                  {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>Tháng {m}</option>
                  ))}
                </select>
              </div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow cursor-pointer"
              >
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>Năm {y}</option>
                ))}
              </select>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm nhân viên..." 
                className="w-full pl-11 pr-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ngày</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nhân viên</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vào ca</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tan ca</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Chi tiết</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Đang tải dữ liệu...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                        <Calendar className="w-12 h-12 mb-3 opacity-20" />
                        <p className="font-medium text-lg text-slate-500 dark:text-slate-400">Chưa có dữ liệu chấm công</p>
                        <p className="text-sm mt-1">Thử chọn tháng khác hoặc thay đổi từ khóa tìm kiếm</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentData.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">
                          {new Date(record.date).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                            {getEmployeeName(record.userName).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{getEmployeeName(record.userName)}</div>
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{record.userName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            {formatTime(record.checkInTimeMillis)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                            <Clock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          </div>
                          <span className="font-semibold text-rose-700 dark:text-rose-400">
                            {formatTime(record.checkOutTimeMillis)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-col gap-1">
                           <span className="font-bold text-slate-800 dark:text-slate-200">
                             {record.totalHours ? `${record.totalHours}h` : '--'}
                           </span>
                           {(record.late_minutes > 0 || record.early_leave_minutes > 0) && (
                              <span className="text-xs text-rose-500">
                                {record.late_minutes > 0 && `Trễ ${record.late_minutes}p`} {record.early_leave_minutes > 0 && `Sớm ${record.early_leave_minutes}p`}
                              </span>
                           )}
                           {record.overtime_hours > 0 && (
                              <span className="text-xs text-emerald-500">
                                OT {record.overtime_hours}h
                              </span>
                           )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!record.checkOutTimeMillis ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/20">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            Đang làm
                          </span>
                        ) : record.status === 'LATE' || record.status === 'EARLY_LEAVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20">
                            <XCircle className="w-3.5 h-3.5" />
                            {record.status === 'LATE' ? 'Đi trễ' : 'Về sớm'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {record.status === 'OT' ? 'Hợp lệ + OT' : 'Hợp lệ'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {filteredData.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/10">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Hiển thị <span className="font-semibold text-slate-700 dark:text-slate-200">{(currentPage - 1) * itemsPerPage + 1}</span> đến <span className="font-semibold text-slate-700 dark:text-slate-200">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> trong tổng số <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredData.length}</span> bản ghi
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
