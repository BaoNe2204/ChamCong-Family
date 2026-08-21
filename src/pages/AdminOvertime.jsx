import React, { useState, useEffect } from 'react';
import { Download, Calendar as CalendarIcon, Clock, Zap, DollarSign, Users, Edit2, X, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function AdminOvertime() {
  const [overtimeData, setOvertimeData] = useState([]);
  const [loading, setLoading] = useState(true);

  const date = new Date();
  const [selectedMonth, setSelectedMonth] = useState(date.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(date.getFullYear());

  const [stats, setStats] = useState({
    totalOtUsers: 0,
    totalOtHours: 0,
    totalOtCost: 0
  });

  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    manualOtHours: 0,
    bonus: 0,
    penalty: 0
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOvertime();
  }, [selectedMonth, selectedYear]);

  const fetchOvertime = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/admin/overtime/${selectedMonth}/${selectedYear}`);
      setOvertimeData(data);

      let otUserCount = 0;
      let sumHours = 0;
      let sumCost = 0;

      data.forEach(item => {
        if (item.totalOtHours > 0) otUserCount++;
        sumHours += item.totalOtHours || 0;
        sumCost += item.estimatedOtPay || 0;
      });

      setStats({
        totalOtUsers: otUserCount,
        totalOtHours: Math.round(sumHours * 10) / 10,
        totalOtCost: sumCost
      });
    } catch (error) {
      console.error("Lỗi tải dữ liệu tăng ca:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      manualOtHours: user.manualOtHours || 0,
      bonus: user.bonus || 0,
      penalty: user.penalty || 0
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.post('/admin/overtime/update', {
        userId: editingUser.userId,
        month: selectedMonth,
        year: selectedYear,
        manualOtHours: Number(formData.manualOtHours),
        bonus: Number(formData.bonus),
        penalty: Number(formData.penalty)
      });
      setEditingUser(null);
      fetchOvertime();
    } catch (error) {
      alert("Lỗi cập nhật tăng ca: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Họ Tên", "Email", "OT Tự Động (H)", "OT Thủ Công (H)", "Tổng OT (H)", "Hệ Số OT", "Thành Tiền (VND)"];
    const rows = overtimeData.map(record => [
      record.userId,
      `"${record.fullName}"`,
      record.email,
      record.autoOtHours,
      record.manualOtHours,
      record.totalOtHours,
      `x${record.otMultiplier}`,
      record.estimatedOtPay
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tang_ca_t${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8 font-sans selection:bg-amber-100 selection:text-amber-900 w-full h-full overflow-y-auto">
      <div className="w-full space-y-8">
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20">
                <Zap className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-500 to-amber-500 tracking-tight">
                Quản Lý Tăng Ca
              </h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
              Tính toán, điều chỉnh và duyệt giờ tăng ca (Overtime) cho toàn nhân sự
            </p>
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
                  <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
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
              className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-2xl font-bold shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-0.5"
            >
              <Download className="w-5 h-5" />
              <span>Xuất Báo Cáo</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm rounded-xl md:rounded-3xl p-2 md:p-6 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 md:w-24 md:h-24 bg-amber-50 dark:bg-amber-500/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 mb-1 md:mb-4">
                <div className="p-1.5 md:p-3 bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 rounded-lg md:rounded-2xl">
                  <Users className="w-4 h-4 md:w-6 md:h-6" />
                </div>
                <h3 className="font-bold text-[9px] md:text-base text-slate-500 dark:text-slate-400 whitespace-nowrap">NS Tăng Ca</h3>
              </div>
              <p className="text-base md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">{stats.totalOtUsers}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm rounded-xl md:rounded-3xl p-2 md:p-6 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 md:w-24 md:h-24 bg-orange-50 dark:bg-orange-500/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 mb-1 md:mb-4">
                <div className="p-1.5 md:p-3 bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 rounded-lg md:rounded-2xl">
                  <Clock className="w-4 h-4 md:w-6 md:h-6" />
                </div>
                <h3 className="font-bold text-[9px] md:text-base text-slate-500 dark:text-slate-400 whitespace-nowrap">Tổng Giờ OT</h3>
              </div>
              <p className="text-base md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">{stats.totalOtHours}h</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl shadow-amber-500/20 rounded-xl md:rounded-3xl p-2 md:p-6 relative overflow-hidden group text-white">
            <div className="absolute -right-4 -top-4 w-16 h-16 md:w-32 md:h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 mb-1 md:mb-4">
                <div className="p-1.5 md:p-3 bg-white/20 rounded-lg md:rounded-2xl backdrop-blur-md">
                  <DollarSign className="w-4 h-4 md:w-6 md:h-6" />
                </div>
                <h3 className="font-bold text-amber-50 text-[8px] md:text-sm uppercase tracking-widest whitespace-nowrap">Quỹ Tiền Tăng Ca</h3>
              </div>
              <p className="text-sm md:text-4xl font-black tracking-tighter drop-shadow-md">{formatMoney(stats.totalOtCost)}</p>
            </div>
          </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-4">
          {loading ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 flex flex-col items-center justify-center space-y-3 border border-slate-200/60 dark:border-slate-800 shadow-sm">
              <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-600 rounded-full animate-spin"></div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Đang tính toán dữ liệu tăng ca...</p>
            </div>
          ) : overtimeData.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 flex flex-col items-center justify-center border border-slate-200/60 dark:border-slate-800 shadow-sm">
              <Zap className="w-12 h-12 mb-3 opacity-20 text-slate-400" />
              <p className="font-medium text-lg text-slate-500 dark:text-slate-400">Không có dữ liệu tăng ca tháng này</p>
            </div>
          ) : (
            overtimeData.map(record => (
              <div key={record.userId} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center font-bold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 shrink-0">
                      {(record.fullName || record.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{record.fullName || 'Chưa cập nhật'}</div>
                      <div className="text-[10px] text-slate-500 truncate">{record.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => openEditModal(record)}
                    className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl text-center">
                    <div className="text-[9px] text-slate-400 font-bold uppercase">OT Tự động</div>
                    <div className="font-bold text-sm text-slate-700 dark:text-slate-200">{record.autoOtHours}h</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl text-center">
                    <div className="text-[9px] text-slate-400 font-bold uppercase">OT Cộng thêm</div>
                    <div className="font-bold text-sm text-amber-600 dark:text-amber-400">+{record.manualOtHours}h</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl text-center">
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Tổng OT</div>
                    <div className="font-black text-sm text-orange-600 dark:text-orange-400">{record.totalOtHours}h</div>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-500/10 p-3 rounded-xl border border-amber-100 dark:border-amber-500/20">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Tiền Tăng Ca (x{record.otMultiplier})</span>
                  <span className="text-base font-black text-amber-700 dark:text-amber-300">{formatMoney(record.estimatedOtPay)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Overtime Table */}
        <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-white/5">
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Nhân viên</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">OT Hệ thống (Tự động)</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">OT Cộng thêm (Admin)</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Tổng Giờ OT</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Hệ Số Tăng Ca</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Tiền Tăng Ca Dự Tính</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center gap-3">
                        <div className="w-6 h-6 border-4 border-amber-500/30 border-t-amber-600 rounded-full animate-spin"></div>
                        <span className="text-slate-500 font-bold">Đang tải dữ liệu tăng ca...</span>
                      </div>
                    </td>
                  </tr>
                ) : overtimeData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center text-slate-500">
                      <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="font-bold">Không có dữ liệu nhân sự tháng này</p>
                    </td>
                  </tr>
                ) : (
                  overtimeData.map(record => (
                    <tr key={record.userId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center font-bold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                            {(record.fullName || record.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-100">{record.fullName || 'Chưa cập nhật tên'}</div>
                            <div className="text-xs text-slate-500">{record.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-slate-600 dark:text-slate-400">
                        {record.autoOtHours}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-amber-600 dark:text-amber-400">
                        +{record.manualOtHours}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex px-3 py-1 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 text-sm font-black border border-amber-200 dark:border-amber-500/30">
                          {record.totalOtHours}h
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 font-extrabold text-xs">
                          x{record.otMultiplier}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-base font-black text-amber-600 dark:text-amber-400">
                          {formatMoney(record.estimatedOtPay)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => openEditModal(record)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/20 rounded-xl transition-colors"
                          title="Điều chỉnh Tăng Ca"
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

      {/* Modal Điều chỉnh Tăng ca */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Điều chỉnh Tăng Ca</h2>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-100 dark:border-amber-500/20">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center font-bold text-amber-700 dark:text-amber-400 text-lg">
                  {(editingUser.fullName || editingUser.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-amber-900 dark:text-amber-100">{editingUser.fullName || 'Chưa cập nhật'}</div>
                  <div className="text-sm text-amber-600 dark:text-amber-400">{editingUser.email}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Số giờ OT cộng thêm thủ công (giờ)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.manualOtHours}
                  onChange={(e) => setFormData({ ...formData, manualOtHours: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/30 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all dark:text-white font-bold text-lg"
                />
                <p className="text-xs text-slate-500 mt-1">Giờ OT tự động hiện tại: <strong className="text-slate-700 dark:text-slate-300">{editingUser.autoOtHours}h</strong></p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-2">Thưởng thêm (VNĐ)</label>
                  <input
                    type="number"
                    value={formData.bonus}
                    onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/30 focus:border-emerald-500 outline-none transition-all dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-rose-700 dark:text-rose-400 mb-2">Khấu trừ (VNĐ)</label>
                  <input
                    type="number"
                    value={formData.penalty}
                    onChange={(e) => setFormData({ ...formData, penalty: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/30 focus:border-rose-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-xl hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Lưu Tăng Ca'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
