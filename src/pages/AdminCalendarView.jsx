import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, User, CheckCircle2, XCircle, X, Save, Edit2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { api, BASE_URL } from '../services/api';

export default function AdminCalendarView() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  
  const [formData, setFormData] = useState({
    action: 'update',
    checkInTime: '08:00:00',
    checkOutTime: '17:00:00'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchAttendanceData();
    }
  }, [selectedUser, currentDate.getMonth(), currentDate.getFullYear()]);

  const fetchUsers = async () => {
    try {
      const data = await api.get('/users');
      // Only show employees
      const employees = data.filter(u => u.role !== 'admin');
      setUsers(employees);
      if (employees.length > 0) setSelectedUser(employees[0].id);
    } catch (error) {
      console.error('Lỗi khi tải danh sách nhân viên:', error);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const data = await api.get(`/admin/attendance/${selectedUser}/${month}/${year}`);
      setAttendanceData(data || []);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu chấm công:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Calendar Logic ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const days = [];
  // Tùy chỉnh lịch để Thứ 2 là ngày đầu tuần
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  for (let i = 0; i < startDay; i++) {
    days.push(null); // empty cells before the 1st
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getDayRecord = (day) => {
    if (!day) return null;
    return attendanceData.find(record => {
      if (!record.date) return false;
      const d = new Date(record.date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const record = getDayRecord(day);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    setSelectedDay({ day, dateStr, record });
    
    if (record) {
      setFormData({
        action: 'update',
        checkInTime: record.checkInTime || '08:00:00',
        checkOutTime: record.checkOutTime || '17:00:00'
      });
    } else {
      setFormData({
        action: 'create',
        checkInTime: '08:00:00',
        checkOutTime: '17:00:00'
      });
    }
    
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDay) return;
    
    try {
      setIsSubmitting(true);
      await api.post('/admin/attendance/update', {
        userId: selectedUser,
        date: selectedDay.dateStr,
        ...formData
      });
      setIsModalOpen(false);
      fetchAttendanceData(); // reload
    } catch (error) {
      alert(error.response?.data?.error || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date();
  
  return (
    <div className="p-4 md:p-8 font-sans selection:bg-indigo-100 selection:text-indigo-900 w-full h-full overflow-y-auto">
      <div className="w-full space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">Lịch Chấm Công</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Giám sát và chỉnh sửa dữ liệu làm việc của nhân sự</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 flex-1 md:flex-none">
              <User className="w-5 h-5 text-slate-400 ml-2" />
              <select 
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="bg-transparent border-none outline-none pr-4 py-2 font-semibold text-slate-700 dark:text-slate-200 w-full cursor-pointer"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200">
                    {u.fullName || u.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 px-4 font-bold text-slate-700 dark:text-slate-200">
              <CalendarIcon className="w-5 h-5 text-indigo-500" />
              Tháng {month + 1}, {year}
            </div>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          {loading && (
            <div className="h-1 bg-indigo-500/20 overflow-hidden relative">
              <div className="absolute top-0 left-0 h-full bg-indigo-500 w-1/3 animate-[slide_1s_ease-in-out_infinite]"></div>
            </div>
          )}
          <div className="p-6">
            <div className="grid grid-cols-7 gap-2 md:gap-4 mb-4">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                <div key={d} className="text-center font-bold text-sm text-slate-400 dark:text-slate-500 uppercase">{d}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1 md:gap-3">
              {days.map((day, idx) => {
                const record = getDayRecord(day);
                const isToday = day && year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
                const isFuture = day && new Date(year, month, day) > today;
                
                return (
                  <div 
                    key={idx}
                    onClick={() => handleDayClick(day)}
                    className={`
                      relative flex flex-col items-center justify-center p-1 md:p-3 h-16 md:h-24 rounded-2xl border-2 transition-all duration-200
                      ${day ? 'cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md' : 'border-transparent bg-transparent'}
                      ${day && !isToday ? 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20' : ''}
                      ${isToday ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10' : ''}
                      ${!day ? 'invisible' : ''}
                    `}
                  >
                    {day && (
                      <>
                        <span className={`text-sm md:text-lg font-bold mb-1 md:mb-2 ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'}`}>
                          {day}
                        </span>
                        
                        {!isFuture ? (
                          record ? (
                            <div className="flex flex-col items-center">
                              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] mb-1"></span>
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Đã đi làm</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] mb-1"></span>
                              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">Nghỉ / Vắng</span>
                            </div>
                          )
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">Chưa đến</span>
                        )}
                        
                        {/* Hover Edit Icon */}
                        <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center w-6 h-6 bg-white dark:bg-slate-800 rounded-full shadow-sm">
                          <Edit2 className="w-3 h-3 text-indigo-500" />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
      </div>

      {/* Modal Cập nhật */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[28px] shadow-2xl border border-slate-200/50 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-500" />
                Cập nhật: Ngày {selectedDay?.day}/{month + 1}/{year}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-5">
                
                {selectedDay?.record && (
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Ảnh chấm công</label>
                    <div className="flex gap-4">
                      {/* Check-in Photo */}
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 mb-1 text-center">Ảnh Check-in</p>
                        {selectedDay.record.checkInPhoto ? (
                          <button type="button" onClick={() => setLightboxImage(`${BASE_URL}${selectedDay.record.checkInPhoto}`)} className="block w-full rounded-lg overflow-hidden border border-slate-200 cursor-zoom-in group">
                            <img src={`${BASE_URL}${selectedDay.record.checkInPhoto}`} alt="Check-in" className="w-full h-32 object-cover group-hover:scale-105 transition-transform" />
                          </button>
                        ) : (
                          <div className="flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                            <span className="text-xs font-medium text-slate-400">Không có ảnh</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Check-out Photo */}
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 mb-1 text-center">Ảnh Check-out</p>
                        {selectedDay.record.checkOutPhoto ? (
                          <button type="button" onClick={() => setLightboxImage(`${BASE_URL}${selectedDay.record.checkOutPhoto}`)} className="block w-full rounded-lg overflow-hidden border border-slate-200 cursor-zoom-in group">
                            <img src={`${BASE_URL}${selectedDay.record.checkOutPhoto}`} alt="Check-out" className="w-full h-32 object-cover group-hover:scale-105 transition-transform" />
                          </button>
                        ) : (
                          <div className="flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                            <span className="text-xs font-medium text-slate-400">Không có ảnh</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Trạng thái */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Hành động</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, action: formData.action === 'delete' ? 'update' : 'update'})}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${formData.action !== 'delete' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'}`}
                    >
                      <CheckCircle2 className="w-6 h-6 mb-1" />
                      <span className="font-bold text-sm">Đi làm</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, action: 'delete'})}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${formData.action === 'delete' ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'}`}
                    >
                      <XCircle className="w-6 h-6 mb-1" />
                      <span className="font-bold text-sm">Xoá công (Nghỉ)</span>
                    </button>
                  </div>
                </div>

                {formData.action !== 'delete' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Giờ Check-in</label>
                      <input 
                        type="time" 
                        step="1"
                        value={formData.checkInTime}
                        onChange={(e) => setFormData({...formData, checkInTime: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800 dark:text-white"
                        required={formData.action !== 'delete'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Giờ Check-out</label>
                      <input 
                        type="time" 
                        step="1"
                        value={formData.checkOutTime}
                        onChange={(e) => setFormData({...formData, checkOutTime: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800 dark:text-white"
                        required={formData.action !== 'delete'}
                      />
                    </div>
                  </div>
                )}
                
                {formData.action === 'delete' && (
                  <div className="flex gap-3 items-center p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-500/20">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">Bản ghi chấm công của ngày này sẽ bị xoá khỏi hệ thống và tính là Nghỉ không phép.</p>
                  </div>
                )}

              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  Huỷ
                </button>
                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 dark:shadow-none transition-colors disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Image Lightbox Modal */}
      {lightboxImage && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setLightboxImage(null)}></div>
          <button 
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={lightboxImage} 
            alt="Preview" 
            className="relative z-10 max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain border border-white/10"
          />
        </div>,
        document.body
      )}
    </div>
  );
}
