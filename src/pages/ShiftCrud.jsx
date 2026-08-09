import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Plus, Edit2, Trash2, ArrowLeft, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function ShiftCrud() {
  const navigate = useNavigate();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    startTime: '08:00',
    endTime: '17:00'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await api.get('/settings/general');
      const loadedShifts = data.shifts || [];
      setShifts(loadedShifts);
    } catch (error) {
      console.error("Lỗi fetch ca làm việc:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newShifts) => {
    try {
      const data = await api.get('/settings/general');
      const updatedSettings = { ...data, shifts: newShifts };
      await api.post('/settings/general', updatedSettings);
      return true;
    } catch (error) {
      alert("Lỗi lưu cấu hình: " + error.message);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.startTime || !formData.endTime) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    let newShifts = [...shifts];

    if (editingId) {
      newShifts = newShifts.map(s => s.id === editingId ? { ...formData, id: editingId } : s);
    } else {
      // Create new shift
      const newId = 'shift_' + Date.now();
      newShifts.push({ ...formData, id: newId });
    }

    const success = await saveSettings(newShifts);
    if (success) {
      setShifts(newShifts);
      setIsModalOpen(false);
    }
  };

  const handleEdit = (shift) => {
    setEditingId(shift.id);
    setFormData({
      id: shift.id,
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (shiftId) => {
    if (window.confirm('Bạn có chắc chắn muốn xoá Ca làm việc này? Nhân viên đang thuộc ca này có thể sẽ bị ảnh hưởng.')) {
      const newShifts = shifts.filter(s => s.id !== shiftId);
      const success = await saveSettings(newShifts);
      if (success) setShifts(newShifts);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      id: '',
      name: '',
      startTime: '08:00',
      endTime: '17:00'
    });
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-4 md:p-8 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="w-full space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin')}
              className="group w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm border border-slate-200/60 dark:border-slate-800 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 dark:text-slate-400 dark:group-hover:text-indigo-400 transition-colors" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-2">Quản lý Ca làm việc</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Tạo và cấu hình các ca làm việc cho công ty.</p>
            </div>
          </div>
          
          <button 
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm hover:shadow-indigo-500/25 hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Thêm Ca mới
          </button>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-sm border border-slate-200/60 dark:border-slate-800 p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shifts.map((shift) => (
              <div key={shift.id} className="bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-lg text-slate-700 dark:text-slate-200">{shift.name}</h4>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(shift)}
                        className="p-2 text-slate-400 hover:text-indigo-600 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(shift.id)}
                        className="p-2 text-slate-400 hover:text-red-600 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900/50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Vào ca: <strong className="text-slate-800 dark:text-slate-200">{shift.startTime}</strong></span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-rose-500" />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Tan ca: <strong className="text-slate-800 dark:text-slate-200">{shift.endTime}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {shifts.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
                Chưa có ca làm việc nào. Hãy thêm ca mới!
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[28px] shadow-2xl border border-slate-200/50 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                {editingId ? 'Sửa Ca Làm Việc' : 'Thêm Ca Làm Việc'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tên Ca (Ví dụ: Ca Hành chính)</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-medium text-slate-800 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Giờ Check-in</label>
                    <input 
                      type="time" 
                      required
                      value={formData.startTime}
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-medium text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Giờ Check-out</label>
                    <input 
                      type="time" 
                      required
                      value={formData.endTime}
                      onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-medium text-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  Hủy
                </button>
                <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow-indigo-500/25 hover:-translate-y-0.5 transition-all duration-200">
                  <Save className="w-4 h-4" />
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
