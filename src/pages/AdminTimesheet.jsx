import React, { useState, useEffect } from 'react';
import { Download, Calendar as CalendarIcon, Users, Clock, CheckSquare } from 'lucide-react';
import { api } from '../services/api';
import * as XLSX from 'xlsx';

export default function AdminTimesheet() {
  const [timesheetData, setTimesheetData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const date = new Date();
  const [selectedMonth, setSelectedMonth] = useState(date.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(date.getFullYear());
  
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalHours: 0,
    totalWorkDays: 0
  });

  useEffect(() => {
    fetchTimesheet();
  }, [selectedMonth, selectedYear]);

  const fetchTimesheet = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/admin/timesheet/${selectedMonth}/${selectedYear}`);
      setTimesheetData(data);
      
      let sumHours = 0;
      let sumDays = 0;
      data.forEach(item => {
        sumHours += item.totalHours || 0;
        sumDays += item.totalDays || 0;
      });
      
      setStats({
        totalEmployees: data.length,
        totalHours: sumHours,
        totalWorkDays: sumDays
      });
      
    } catch (error) {
      console.error("Lỗi lấy dữ liệu bảng chấm công:", error);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    return `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  });

  const handleExportExcel = () => {
    const data = [];
    const header = ["ID", "Họ Tên", "Email"];
    for (let i = 1; i <= daysInMonth; i++) {
        header.push(`Ngày ${i}`);
    }
    header.push("Tổng Ngày");
    header.push("Tổng Giờ");
    data.push(header);

    timesheetData.forEach(user => {
      const row = [user.userId, user.fullName || "Chưa cập nhật", user.email];
      
      daysArray.forEach(dateStr => {
        const dayData = user.days[dateStr];
        row.push(dayData ? dayData.totalHours : 0);
      });
      
      row.push(user.totalDays);
      row.push(user.totalHours);
      data.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `T${selectedMonth}-${selectedYear}`);
    
    // Auto fit columns
    const wscols = [
        { wch: 15 }, // ID
        { wch: 25 }, // Name
        { wch: 25 }, // Email
    ];
    for(let i=0; i<daysInMonth; i++) wscols.push({ wch: 8 });
    wscols.push({ wch: 12 });
    wscols.push({ wch: 12 });
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Bang_Cham_Cong_T${selectedMonth}_${selectedYear}.xlsx`);
  };

  return (
    <div className="p-4 md:p-8 font-sans selection:bg-blue-100 selection:text-blue-900 w-full h-full overflow-y-auto">
      <div className="w-full space-y-8">
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 tracking-tight">Bảng Chấm Công Chi Tiết</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Quản lý giờ làm việc từng ngày của nhân sự</p>
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
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5"
          >
            <Download className="w-5 h-5" />
            <span>Xuất file Excel</span>
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
                <Users className="w-4 h-4 md:w-6 md:h-6" />
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
        
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm rounded-xl md:rounded-3xl p-2 md:p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 md:w-24 md:h-24 bg-amber-50 dark:bg-amber-500/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 mb-1 md:mb-4">
              <div className="p-1.5 md:p-3 bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 rounded-lg md:rounded-2xl">
                <CheckSquare className="w-4 h-4 md:w-6 md:h-6" />
              </div>
              <h3 className="font-bold text-[9px] md:text-base text-slate-500 dark:text-slate-400 whitespace-nowrap">Tổng Công</h3>
            </div>
            <p className="text-base md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">{stats.totalWorkDays} ng</p>
          </div>
        </div>
      </div>

      {/* Mobile Card View (No Horizontal Scroll) */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 flex flex-col items-center justify-center space-y-3 border border-slate-200/60 dark:border-slate-800 shadow-sm">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Đang tải dữ liệu...</p>
          </div>
        ) : timesheetData.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 flex flex-col items-center justify-center border border-slate-200/60 dark:border-slate-800 shadow-sm">
            <CalendarIcon className="w-12 h-12 mb-3 opacity-20 text-slate-400" />
            <p className="font-medium text-lg text-slate-500 dark:text-slate-400">Không có dữ liệu chấm công</p>
          </div>
        ) : (
          timesheetData.map(record => (
            <div key={record.userId} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200/60 dark:border-slate-800">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{record.fullName || 'Chưa cập nhật'}</div>
                  <div className="text-[10px] text-slate-500">{record.email}</div>
                </div>
                <div className="flex gap-2 text-center">
                  <div className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg px-2 py-1">
                    <div className="text-[9px] uppercase font-bold">Công</div>
                    <div className="font-black text-sm">{record.totalWorkDays}</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg px-2 py-1">
                    <div className="text-[9px] uppercase font-bold">Giờ</div>
                    <div className="font-black text-sm">{Math.round(record.totalHours * 10) / 10}</div>
                  </div>
                </div>
              </div>
              
              {/* 31 days grid */}
              <div className="grid grid-cols-7 gap-1">
                {daysArray.map((dateStr, index) => {
                  const dayData = record.days[dateStr];
                  const isWeekend = new Date(dateStr).getDay() === 0 || new Date(dateStr).getDay() === 6;
                  const dayNum = index + 1;
                  const hasData = dayData && dayData.totalHours > 0;
                  
                  return (
                    <div key={index} className={`flex flex-col items-center justify-center py-1.5 rounded-md border ${hasData ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800/50' : isWeekend ? 'bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800' : 'border-slate-100 dark:border-slate-800'}`}>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-none mb-1">{dayNum}</span>
                      {hasData ? (
                        <span className={`text-[11px] font-bold leading-none ${!dayData.isValid ? 'text-rose-500' : 'text-blue-600 dark:text-blue-400'}`}>{Math.round(dayData.totalHours * 10) / 10}</span>
                      ) : (
                        <span className="text-[10px] text-slate-300 dark:text-slate-600 leading-none">-</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Matrix Table (Desktop Only) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                <th className="px-2 md:px-4 py-3 text-[11px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/90 dark:bg-slate-900/90 min-w-[140px] md:min-w-[180px] sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                  Nhân viên
                </th>
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <th key={i} className="px-1 py-3 text-[11px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center min-w-[32px] md:min-w-[40px]">
                    {i + 1}
                  </th>
                ))}
                <th className="px-2 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center bg-slate-50/90 dark:bg-slate-900/90">
                  CÔNG
                </th>
                <th className="px-2 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center bg-slate-50/90 dark:bg-slate-900/90">
                  GIỜ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={daysInMonth + 3} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : timesheetData.length === 0 ? (
                <tr>
                  <td colSpan={daysInMonth + 3} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                      <CalendarIcon className="w-12 h-12 mb-3 opacity-20" />
                      <p className="font-medium text-lg text-slate-500 dark:text-slate-400">Không có dữ liệu chấm công</p>
                    </div>
                  </td>
                </tr>
              ) : (
                timesheetData.map((record) => (
                  <tr key={record.userId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-2 md:px-4 py-3 whitespace-nowrap bg-white/95 dark:bg-slate-900/95 border-r border-slate-100 dark:border-slate-800/60 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-xs md:text-sm truncate max-w-[130px] md:max-w-[170px]">{record.fullName || 'Chưa cập nhật'}</div>
                      <div className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 truncate max-w-[130px] md:max-w-[170px]">{record.email}</div>
                    </td>
                    
                    {daysArray.map((dateStr, index) => {
                      const dayData = record.days[dateStr];
                      const isWeekend = new Date(dateStr).getDay() === 0 || new Date(dateStr).getDay() === 6;
                      
                      return (
                        <td key={index} className={`px-0.5 py-2 text-center border-r border-slate-50 dark:border-slate-800/30 ${isWeekend ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''}`}>
                          {dayData && dayData.totalHours > 0 ? (
                            <div className="w-full h-full flex flex-col items-center justify-center">
                                <span className={`text-[12px] md:text-sm font-bold ${!dayData.isValid ? 'text-rose-500' : 'text-blue-600 dark:text-blue-400'}`}>
                                  {Math.round(dayData.totalHours * 10) / 10}
                                </span>
                            </div>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 font-medium text-[11px] md:text-xs">-</span>
                          )}
                        </td>
                      );
                    })}

                    <td className="px-2 py-2 whitespace-nowrap text-center bg-white/90 dark:bg-slate-900/90 border-l border-slate-100 dark:border-slate-800/60">
                      <div className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                        <span className="font-black text-amber-600 dark:text-amber-400 text-xs">{record.totalDays}</span>
                      </div>
                    </td>
                    
                    <td className="px-2 py-2 whitespace-nowrap text-center bg-white/90 dark:bg-slate-900/90">
                      <div className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">{record.totalHours}</span>
                      </div>
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
