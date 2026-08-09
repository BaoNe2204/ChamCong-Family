import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, Clock, Search, FileText, Filter, Calendar, X, MessageSquare } from 'lucide-react';
import { api } from '../services/api';

export default function RequestManagement() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // pending, history

  // Custom Modal State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await api.get('/requests');
      setRequests(data);
    } catch (error) {
      console.error("Lỗi tải đơn:", error);
    } finally {
      setLoading(false);
    }
  };

  const openNoteModal = (requestId, newStatus, userId) => {
    setCurrentRequest({ id: requestId, status: newStatus, userId });
    setAdminNote('');
    setIsNoteModalOpen(true);
  };

  const confirmUpdateStatus = async (e) => {
    e.preventDefault();
    if (!currentRequest) return;
    
    try {
      setIsSubmitting(true);
      const { id, status, userId } = currentRequest;
      
      await api.put(`/requests/${id}`, {
        status: status,
        adminNote: adminNote,
        userId: userId
      });
      
      // Update local state
      setRequests(requests.map(req => 
        req.id === id ? { ...req, status: status, adminNote: adminNote } : req
      ));
      
      setIsNoteModalOpen(false);
      setCurrentRequest(null);
    } catch (error) {
      alert('Lỗi: ' + error.message);
    } finally {
      setIsSubmitting(false);
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
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'rejected': return 'bg-rose-50 text-rose-600 border-rose-200';
      default: return 'bg-[#fff5cc] text-[#c27c10] border-[#f5c351]';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved': return <CheckCircle2 className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchSearch = (req.userName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchTab = activeTab === 'pending' ? req.status === 'pending' : req.status !== 'pending';
    return matchSearch && matchTab;
  });

  const formatDateStr = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN');
    } catch(e) {
      return dateStr;
    }
  };

  return (
    <div className="p-4 md:p-8 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="w-full space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">
              Yêu cầu & Đơn từ
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
              Phê duyệt các yêu cầu từ nhân sự
            </p>
          </div>
        </div>

        {/* Filters and Tabs */}
        <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 md:w-32 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'pending' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Chờ duyệt
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 md:w-32 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'history' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Đã xử lý
            </button>
          </div>
          
          <div className="relative w-full md:w-80 px-2 md:px-0">
            <Search className="w-4 h-4 absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo email..." 
              className="w-full pl-10 md:pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 p-12 text-center">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Đang tải dữ liệu...</p>
              </div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 p-16 text-center">
              <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                <FileText className="w-16 h-16 mb-4 opacity-20" />
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-1">Không có đơn từ nào</h3>
                <p className="text-sm">Hiện tại không có đơn từ nào trong danh mục này.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map(req => (
                <div key={req.id} className="bg-white dark:bg-slate-900 rounded-[28px] p-5 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all flex flex-col h-full">
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                        {(req.userName || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100 text-[15px]">{req.userName}</p>
                        <p className="text-xs font-medium text-slate-400">
                          {formatDateStr(req.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-bold border ${getStatusColor(req.status)}`}>
                      {getStatusIcon(req.status)}
                      {req.status === 'pending' ? 'Chờ duyệt' : req.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                    </span>
                  </div>

                  <div className="flex-1 bg-white rounded-2xl p-4 border border-slate-100 mb-6 space-y-4">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Loại đơn</span>
                      <p className="font-bold text-slate-700 flex items-center gap-2 text-[15px]">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        {getTypeLabel(req.type)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Ngày xin</span>
                      <p className="font-semibold text-slate-600 flex items-center gap-2 text-[14px]">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {formatDateStr(req.date)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Lý do</span>
                      <p className="text-[14px] text-slate-500 italic bg-white p-3 rounded-xl border border-slate-100">
                        {req.type === 'Đổi ca' && req.targetUserName ? (
                          <span className="font-bold text-indigo-600 mb-1 block">
                            Đổi ca với: {req.targetUserName}
                          </span>
                        ) : null}
                        "{req.reason}"
                      </p>
                    </div>
                    
                    {req.adminNote && (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">Ghi chú của Admin</span>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {req.adminNote}
                        </p>
                      </div>
                    )}
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex gap-3 mt-auto">
                      <button
                        onClick={() => openNoteModal(req.id, 'rejected', req.userId)}
                        className="flex-1 py-3 px-4 rounded-xl font-bold text-rose-500 bg-[#fff0f0] hover:bg-rose-50 transition-colors"
                      >
                        Từ chối
                      </button>
                      <button
                        onClick={() => openNoteModal(req.id, 'approved', req.userId)}
                        className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-[#4a3aff] hover:bg-blue-700 shadow-sm transition-colors"
                      >
                        Duyệt đơn
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Note Modal */}
      {isNoteModalOpen && currentRequest && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden shadow-indigo-500/10" onClick={e => e.stopPropagation()}>
            <div className={`p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${currentRequest.status === 'approved' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                  {currentRequest.status === 'approved' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                    {currentRequest.status === 'approved' ? 'Duyệt đơn từ' : 'Từ chối đơn từ'}
                  </h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Bạn có thể đính kèm một lời nhắn</p>
                </div>
              </div>
              <button onClick={() => setIsNoteModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={confirmUpdateStatus} className="p-6">
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  Lý do / Phản hồi (Tùy chọn)
                </label>
                <textarea 
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-slate-700 dark:text-slate-200 resize-none h-32"
                  placeholder={currentRequest.status === 'approved' ? "Ví dụ: Đồng ý cho bạn nghỉ, nhớ bàn giao công việc..." : "Ví dụ: Không duyệt vì lý do công việc đang gấp..."}
                />
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsNoteModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`flex-1 py-3 px-4 font-semibold rounded-xl shadow-md transition-all flex justify-center items-center gap-2 ${
                    currentRequest.status === 'approved' 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20' 
                      : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
                  } disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Xác nhận'
                  )}
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
