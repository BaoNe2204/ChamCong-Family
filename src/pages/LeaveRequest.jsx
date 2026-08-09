import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Plus, FileText, CheckCircle2, Clock, XCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function LeaveRequest() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'nghi_phep', // nghi_phep, tang_ca, di_tre, ve_som
    date: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [currentUser]);

  const fetchRequests = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const q = query(
        collection(db, 'requests'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(data);
    } catch (error) {
      console.error("Lỗi tải đơn:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.reason) {
      alert('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'requests'), {
        userId: currentUser.uid,
        userName: currentUser.fullName || currentUser.email,
        type: formData.type,
        date: formData.date,
        reason: formData.reason,
        status: 'pending', // pending, approved, rejected
        createdAt: serverTimestamp(),
      });
      
      alert('Nộp đơn thành công!');
      setIsModalOpen(false);
      setFormData({ type: 'nghi_phep', date: '', reason: '' });
      fetchRequests();
    } catch (error) {
      console.error("Lỗi nộp đơn:", error);
      alert('Lỗi: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle2 className="w-3 h-3"/> Đã duyệt</span>;
      case 'rejected': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"><XCircle className="w-3 h-3"/> Từ chối</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="w-3 h-3"/> Chờ duyệt</span>;
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      'nghi_phep': 'Nghỉ phép',
      'tang_ca': 'Tăng ca',
      'di_tre': 'Đi trễ',
      've_som': 'Về sớm'
    };
    return types[type] || type;
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
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Đơn từ & Yêu cầu</h1>
              <p className="text-slate-500 dark:text-slate-400">Quản lý các yêu cầu nghỉ phép, đi trễ của bạn</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tạo đơn mới
          </button>
        </div>

        {/* List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <h2 className="font-semibold text-slate-800 dark:text-white">Danh sách đơn đã nộp</h2>
          </div>
          
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>
            ) : requests.length === 0 ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <FileText className="w-12 h-12 text-slate-300 mb-3" />
                <p>Bạn chưa có đơn từ nào.</p>
              </div>
            ) : (
              requests.map(req => (
                <div key={req.id} className="p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{getTypeLabel(req.type)}</span>
                      {getStatusBadge(req.status)}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                      Ngày áp dụng: <span className="font-medium text-slate-700 dark:text-slate-300">{req.date}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700/50">
                      Lý do: {req.reason}
                    </p>
                    {req.adminNote && (
                      <p className="text-sm text-rose-600 dark:text-rose-400 mt-2 font-medium">
                        Phản hồi: {req.adminNote}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 whitespace-nowrap">
                    Nộp lúc: {req.createdAt?.toDate().toLocaleDateString('vi-VN')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Tạo đơn mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Loại đơn</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  <option value="nghi_phep">Nghỉ phép</option>
                  <option value="tang_ca">Tăng ca</option>
                  <option value="di_tre">Đi trễ</option>
                  <option value="ve_som">Về sớm</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ngày áp dụng</label>
                <input 
                  type="date" 
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Lý do / Ghi chú chi tiết</label>
                <textarea 
                  required
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
                  placeholder="Nhập lý do xin nghỉ/đi trễ..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-70 flex items-center justify-center"
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi đơn'}
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
