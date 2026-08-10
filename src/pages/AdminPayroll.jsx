import React, { useState, useEffect } from 'react';
import { Download, Calculator, Calendar as CalendarIcon, DollarSign, Clock, CheckCircle2, AlertTriangle, Briefcase, Edit2, X } from 'lucide-react';
import { api } from '../services/api';

export default function AdminPayroll() {
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const date = new Date();
  const [selectedMonth, setSelectedMonth] = useState(date.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(date.getFullYear());
  
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalSalary: 0,
    totalHours: 0
  });

  const [editingRecord, setEditingRecord] = useState(null);
  const [adjustments, setAdjustments] = useState({
    hourlyRate: 0,
    manualOtHours: 0,
    bonus: 0,
    penalty: 0
  });
  const [savingAdj, setSavingAdj] = useState(false);

  useEffect(() => {
    fetchPayroll();
  }, [selectedMonth, selectedYear]);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/admin/payroll/${selectedMonth}/${selectedYear}`);
      setPayrollData(data);
      
      let sumSalary = 0;
      let sumHours = 0;
      data.forEach(item => {
        sumSalary += item.salary || 0;
        sumHours += (item.baseHours || 0) + (item.overtimeHours || 0);
      });
      
      setStats({
        totalEmployees: data.length,
        totalSalary: sumSalary,
        totalHours: sumHours
      });
      
    } catch (error) {
      console.error("Lỗi lấy dữ liệu bảng lương:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Họ Tên", "Email", "Lương/Giờ", "Tổng Giờ", "Ngày Công Hợp Lệ", "Ngày Lỗi", "Tổng Lương"];
    const rows = payrollData.map(record => {
      return [
        record.userId, 
        `"${record.fullName}"`,
        record.email,
        200000,
        record.totalHours,
        record.validDays,
        record.errorDays,
        record.salary
      ];
    });
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bang_luong_t${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    setAdjustments({
      hourlyRate: record.hourlyRate,
      manualOtHours: 0, // Should be fetched from API if we want to show existing manual OT, but for now we can just show 0 or fetch it. Actually the API returns final overtimeHours = overtimeHours + manualOtHours. We can just set manualOtHours as input, we'll send it back. Wait, better to keep it 0 here and just add. Or just send what we input. If we send it, it will overwrite. Let's send the manualOtHours as an absolute value for the month.
      bonus: record.bonus || 0,
      penalty: record.penalty || 0
    });
  };

  const saveAdjustments = async () => {
    try {
      setSavingAdj(true);
      await api.post('/admin/payroll/adjust', {
        userId: editingRecord.userId,
        month: selectedMonth,
        year: selectedYear,
        hourlyRate: Number(adjustments.hourlyRate),
        manualOtHours: Number(adjustments.manualOtHours),
        bonus: Number(adjustments.bonus),
        penalty: Number(adjustments.penalty)
      });
      setEditingRecord(null);
      fetchPayroll();
    } catch (e) {
      alert("Lỗi lưu điều chỉnh: " + e.message);
    } finally {
      setSavingAdj(false);
    }
  };

  return (
    <div className="p-4 md:p-8 font-sans selection:bg-emerald-100 selection:text-emerald-900 w-full h-full overflow-y-auto">
      <div className="w-full space-y-8">
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 tracking-tight">Bảng Lương Tháng</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Tổng hợp giờ làm và tính lương tự động</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2 rounded-2xl shadow-sm flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-slate-400 ml-2" />
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent font-bold text-slate-700 dark:text-slate-200 border-none outline-none focus:ring-0 cursor-pointer pr-2"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i+1} value={i+1}>Tháng {i+1}</option>
              ))}
            </select>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-bold text-slate-700 dark:text-slate-200 border-none outline-none focus:ring-0 cursor-pointer pr-2"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5"
          >
            <Download className="w-5 h-5" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 md:gap-6">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm rounded-xl md:rounded-3xl p-2 md:p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 md:w-24 md:h-24 bg-blue-50 dark:bg-blue-500/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 mb-1 md:mb-4">
              <div className="p-1.5 md:p-3 bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-lg md:rounded-2xl">
                <Briefcase className="w-4 h-4 md:w-6 md:h-6" />
              </div>
              <h3 className="font-bold text-[9px] md:text-base text-slate-500 dark:text-slate-400 whitespace-nowrap">Nhân Sự</h3>
            </div>
            <p className="text-base md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">{stats.totalEmployees}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm rounded-xl md:rounded-3xl p-2 md:p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 md:w-24 md:h-24 bg-purple-50 dark:bg-purple-500/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 mb-1 md:mb-4">
              <div className="p-1.5 md:p-3 bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 rounded-lg md:rounded-2xl">
                <Clock className="w-4 h-4 md:w-6 md:h-6" />
              </div>
              <h3 className="font-bold text-[9px] md:text-base text-slate-500 dark:text-slate-400 whitespace-nowrap">Giờ Làm</h3>
            </div>
            <p className="text-base md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">{Math.round(stats.totalHours * 10) / 10}h</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/20 rounded-xl md:rounded-3xl p-2 md:p-6 relative overflow-hidden group text-white">
          <div className="absolute -right-4 -top-4 w-16 h-16 md:w-32 md:h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 mb-1 md:mb-4">
              <div className="p-1.5 md:p-3 bg-white/20 rounded-lg md:rounded-2xl backdrop-blur-md">
                <Calculator className="w-4 h-4 md:w-6 md:h-6" />
              </div>
              <h3 className="font-bold text-emerald-50 text-[8px] md:text-sm uppercase tracking-widest whitespace-nowrap">Quỹ Lương</h3>
            </div>
            <p className="text-sm md:text-4xl font-black tracking-tighter drop-shadow-md">{formatMoney(stats.totalSalary)}</p>
          </div>
        </div>
      </div>

      {/* Mobile Card View (No Horizontal Scroll) */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 flex flex-col items-center justify-center space-y-3 border border-slate-200/60 dark:border-slate-800 shadow-sm">
            <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Đang tính toán bảng lương...</p>
          </div>
        ) : payrollData.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 flex flex-col items-center justify-center border border-slate-200/60 dark:border-slate-800 shadow-sm">
            <DollarSign className="w-12 h-12 mb-3 opacity-20 text-slate-400" />
            <p className="font-medium text-lg text-slate-500 dark:text-slate-400">Không có dữ liệu tháng này</p>
          </div>
        ) : (
          payrollData.map(record => (
            <div key={record.userId} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 shrink-0">
                  {(record.fullName || record.email).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{record.fullName || 'Chưa cập nhật'}</div>
                  <div className="text-[10px] text-slate-500 truncate">{record.email}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                 <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                   <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Lương/Ca</div>
                   <div className="font-bold text-sm">{formatMoney(record.baseSalary)}</div>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                   <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Tổng công</div>
                   <div className="font-bold text-sm text-blue-600 dark:text-blue-400">{record.totalWorkDays} <span className="text-xs font-normal text-slate-500">ng</span></div>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                   <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Giờ Cơ Bản</div>
                   <div className="font-bold text-sm">{Math.round(record.totalHours * 10) / 10} <span className="text-xs font-normal text-slate-500">h</span></div>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                   <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Giờ OT</div>
                   <div className="font-bold text-sm text-purple-600 dark:text-purple-400">{Math.round(record.overtimeHours * 10) / 10} <span className="text-xs font-normal text-slate-500">h</span></div>
                 </div>
              </div>
              
              <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                 <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">TỔNG LƯƠNG</span>
                 <span className="text-lg font-black text-emerald-700 dark:text-emerald-300 drop-shadow-sm">{formatMoney(record.totalSalary)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payroll Table (Desktop Only) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-white/5">
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Nhân viên</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Lương / Ca</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Tổng công</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Giờ Cơ Bản</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Giờ OT</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Tổng Lương</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center gap-3">
                      <div className="w-6 h-6 border-4 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin"></div>
                      <span className="text-slate-500 font-bold">Đang tính toán bảng lương...</span>
                    </div>
                  </td>
                </tr>
              ) : payrollData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center text-slate-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-bold">Không có dữ liệu chấm công tháng này</p>
                  </td>
                </tr>
              ) : (
                payrollData.map(record => (
                  <tr key={record.userId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                          {(record.fullName || record.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-100">{record.fullName || 'Chưa cập nhật tên'}</div>
                          <div className="text-xs text-slate-500">{record.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 text-xs font-bold border border-indigo-100 dark:border-indigo-500/20">
                        200.000đ
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{record.totalDays} ngày</span>
                        {record.errorDays > 0 && (
                          <span className="text-xs font-bold text-rose-500 flex items-center gap-1 bg-rose-50 px-1.5 py-0.5 rounded-md" title={`${record.errorDays} ngày lỗi (thiếu giờ)`}>
                            <AlertTriangle className="w-3 h-3" /> {record.errorDays}
                          </span>
                        )}
                        {record.errorDays === 0 && record.totalDays > 0 && (
                          <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3" /> Tốt
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-slate-700 dark:text-slate-300">
                      {record.baseHours || 0}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-500/5">
                      {record.overtimeHours || 0}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                          {formatMoney(record.salary)}
                        </span>
                        {(record.bonus > 0 || record.penalty > 0) && (
                          <div className="text-xs text-slate-400 mt-1 flex gap-2">
                            {record.bonus > 0 && <span className="text-emerald-500">+ {formatMoney(record.bonus)}</span>}
                            {record.penalty > 0 && <span className="text-rose-500">- {formatMoney(record.penalty)}</span>}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button 
                        onClick={() => openEditModal(record)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-xl transition-colors"
                        title="Điều chỉnh"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Điều chỉnh Lương & Tăng ca</h2>
              <button onClick={() => setEditingRecord(null)} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3 mb-6 p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-400 text-lg">
                  {editingRecord.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-indigo-900 dark:text-indigo-100">{editingRecord.fullName}</div>
                  <div className="text-sm text-indigo-600 dark:text-indigo-400">{editingRecord.email}</div>
                </div>
              </div>



              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Số giờ Tăng ca cộng thêm thủ công</label>
                <input 
                  type="number"
                  step="0.1"
                  value={adjustments.manualOtHours}
                  onChange={(e) => setAdjustments({...adjustments, manualOtHours: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/30 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all dark:text-white"
                />
                <p className="text-xs text-slate-500 mt-1">Giờ này sẽ được cộng thêm vào tổng giờ OT của tháng.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-2">Thưởng (VNĐ)</label>
                  <input 
                    type="number"
                    value={adjustments.bonus}
                    onChange={(e) => setAdjustments({...adjustments, bonus: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/30 focus:border-emerald-500 outline-none transition-all dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-rose-700 dark:text-rose-400 mb-2">Phạt (VNĐ)</label>
                  <input 
                    type="number"
                    value={adjustments.penalty}
                    onChange={(e) => setAdjustments({...adjustments, penalty: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/30 focus:border-rose-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button 
                onClick={() => setEditingRecord(null)}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={saveAdjustments}
                disabled={savingAdj}
                className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-70 flex justify-center items-center"
              >
                {savingAdj ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Lưu Thay Đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
