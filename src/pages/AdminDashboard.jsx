import React, { useState, useEffect } from 'react';
import { Users, FileDown, Search, ArrowLeft, Settings, Calendar, CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [stats, setStats] = useState({
    totalUsers: 0,
    workingToday: 0,
  });

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Lấy danh sách users để map tên
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(doc => ({id: doc.id, ...doc.data()}));
      setUsers(usersData);
      
      // 2. Lấy dữ liệu điểm danh tháng được chọn
      const startStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const endStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-31`;
      
      const q = query(
        collection(db, 'attendance'),
        where('date', '>=', startStr),
        where('date', '<=', endStr),
        orderBy('date', 'desc')
      );
      
      const attSnap = await getDocs(q);
      const attData = attSnap.docs.map(doc => ({id: doc.id, ...doc.data()}));
      setAttendance(attData);
      
      // 3. Tính toán Stats
      const today = new Date().toISOString().split('T')[0];
      const todayCount = attData.filter(r => r.date === today).length;
      
      setStats({
        totalUsers: usersData.length,
        workingToday: todayCount,
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
    return new Date(millis).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
  };

  const filteredData = attendance.filter(record => {
    const name = getEmployeeName(record.userName).toLowerCase();
    const email = (record.userName || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search) || email.includes(search);
  });

  const handleExportCSV = () => {
    const headers = ["Ngày", "Họ Tên", "Email", "Vào ca", "Tan ca", "Tổng giờ", "Trạng thái"];
    const rows = filteredData.map(record => {
      const checkIn = formatTime(record.checkInTimeMillis);
      const checkOut = formatTime(record.checkOutTimeMillis);
      const status = record.isValidShift ? "Hợp lệ" : (record.checkOutTimeMillis ? "Thiếu giờ" : "Đang làm");
      return [
        record.date, 
        `"${getEmployeeName(record.userName)}"`, // Wrap in quotes to avoid comma issues
        record.userName,
        checkIn, 
        checkOut, 
        record.totalHours || 0,
        status
      ];
    });
    
    // Thêm BOM (\uFEFF) để Excel nhận dạng được Tiếng Việt UTF-8
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Bảng Quản Lý Chấm Công</h1>
              <p className="text-slate-500 dark:text-slate-400">Xem và xuất dữ liệu công nhân viên</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => navigate('/admin/settings')}
              className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-600 dark:text-slate-300"
              title="Cấu hình hệ thống"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate('/admin/requests')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700/50 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 font-medium transition-colors"
            >
              <FileText className="w-4 h-4" />
              Duyệt Đơn
            </button>
            <button 
              onClick={() => navigate('/admin/employees')}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 font-medium"
            >
              <Users className="w-4 h-4" />
              Quản lý NV
            </button>
            <button 
              onClick={handleExportCSV}
              disabled={filteredData.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium shadow-sm disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              Xuất Excel
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 font-medium mb-1">Tổng nhân sự</p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{stats.totalUsers}</h3>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 font-medium mb-1">Đi làm hôm nay</p>
            <h3 className="text-3xl font-bold text-primary-600">{stats.workingToday}</h3>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 font-medium mb-1">Vắng mặt (Ước tính)</p>
            <h3 className="text-3xl font-bold text-rose-500">{Math.max(0, stats.totalUsers - stats.workingToday)}</h3>
          </div>
        </div>

        {/* Table Area */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3 w-full md:w-auto">
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

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên nhân viên..." 
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nhân viên</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vào ca</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tan ca</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng giờ</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Đang tải dữ liệu...</td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Không tìm thấy dữ liệu chấm công.</td>
                  </tr>
                ) : (
                  filteredData.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {record.date}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{getEmployeeName(record.userName)}</div>
                        <div className="text-xs text-slate-500">{record.userName}</div>
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
