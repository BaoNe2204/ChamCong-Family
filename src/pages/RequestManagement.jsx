import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Clock, Search, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, orderBy, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function RequestManagement() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [activeTab, setActiveTab] = useState('pending'); // pending, history

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'requests'),
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

  const handleUpdateStatus = async (requestId, newStatus, userId) => {
    const reason = prompt(`Nhập lý do (tùy chọn) khi ${newStatus === 'approved' ? 'duyệt' : 'từ chối'} đơn:`);
    if (reason === null) return; // User cancelled prompt

    try {
      await updateDoc(doc(db, 'requests', requestId), {
        status: newStatus,
        adminNote: reason
      });
      
      // Tạo thông báo cho user
      await addDoc(collection(db, 'notifications'), {
        userId: userId,
        title: `Đơn của bạn đã bị ${newStatus === 'approved' ? 'duyệt' : 'từ chối'}`,
        message: `Phản hồi: ${reason || 'Không có'}`,
        isRead: false,
        createdAt: serverTimestamp()
      });

      // Cập nhật state local
      setRequests(requests.map(req => req.id === requestId ? { ...req, status: newStatus, adminNote: reason } : req));
      alert('Đã cập nhật trạng thái đơn!');
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      alert('Lỗi: ' + error.message);
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

  const filteredRequests = requests.filter(req => {
    const matchSearch = (req.userName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchTab = activeTab === 'pending' ? req.status === 'pending' : req.status !== 'pending';
    return matchSearch && matchTab;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin')}
              className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Duyệt Đơn Yêu Cầu</h1>
              <p className="text-slate-500 dark:text-slate-400">Xử lý các đơn từ của nhân viên</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex bg-slate-200/50 dark:bg-slate-900 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'pending' 
                    ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Cần duyệt ({requests.filter(r => r.status === 'pending').length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'history' 
                    ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Đã xử lý
              </button>
            </div>

            <div className="relative w-full sm:w-64">
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
          
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <FileText className="w-12 h-12 text-slate-300 mb-3" />
                <p>Không có đơn từ nào.</p>
              </div>
            ) : (
              filteredRequests.map(req => (
                <div key={req.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors flex flex-col md:flex-row gap-6 justify-between md:items-center">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between md:justify-start gap-4">
                      <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">{req.userName}</h3>
                      <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {req.createdAt?.toDate().toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-primary-600 dark:text-primary-400">{getTypeLabel(req.type)}</span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">Áp dụng: <span className="font-semibold text-slate-800 dark:text-slate-200">{req.date}</span></span>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50 mt-2">
                      <span className="font-medium">Lý do: </span>{req.reason}
                    </p>
                    
                    {req.adminNote && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                        Đã phản hồi: {req.adminNote}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    {req.status === 'pending' ? (
                      <>
                        <button 
                          onClick={() => handleUpdateStatus(req.id, 'rejected', req.userId)}
                          className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 rounded-lg font-medium transition-colors text-sm"
                        >
                          Từ chối
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(req.id, 'approved', req.userId)}
                          className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-medium transition-colors text-sm shadow-sm flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Duyệt Đơn
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        {req.status === 'approved' 
                          ? <><CheckCircle2 className="w-4 h-4 text-emerald-500"/> <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Đã duyệt</span></>
                          : <><XCircle className="w-4 h-4 text-rose-500"/> <span className="text-sm font-medium text-rose-700 dark:text-rose-400">Đã từ chối</span></>
                        }
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
