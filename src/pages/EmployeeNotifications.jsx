import React, { useState, useEffect } from 'react';
import { Bell, Check, Circle, Trash2, CalendarClock, MessageSquare } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function EmployeeNotifications() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.get('/notifications');
      setNotifications(data || []);
    } catch (error) {
      console.error("Lỗi khi tải thông báo:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put('/notifications/read', { notificationIds: [id] });
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: 1 } : n)
      );
    } catch (error) {
      console.error("Lỗi khi đánh dấu đã đọc:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      if (unreadIds.length === 0) return;
      await api.put('/notifications/read', { notificationIds: unreadIds });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
    } catch (error) {
      console.error("Lỗi khi đánh dấu tất cả đã đọc:", error);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  return (
    <div className="w-full h-full p-4 md:p-6 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-500 overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-500/20 dark:to-blue-500/20 rounded-2xl border border-indigo-200/50 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 shadow-sm relative">
            <Bell className="w-6 h-6" />
            {notifications.some(n => !n.isRead) && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse"></span>
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800 dark:text-white">Thông báo</h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-0.5">Cập nhật tin tức công ty và trạng thái duyệt đơn</p>
          </div>
        </div>
        
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-sm rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors w-max"
          >
            <Check className="w-4 h-4" />
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pr-2 pb-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Đang tải thông báo...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center mt-20 animate-[fadeIn_0.5s_ease-out]">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 rounded-full flex items-center justify-center mb-6">
              <Bell className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Bạn chưa có thông báo nào</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm max-w-sm">Mọi cập nhật về đơn xin phép hoặc tin tức từ công ty sẽ hiển thị ở đây.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notifications.map((note) => (
              <div 
                key={note.id} 
                onClick={() => !note.isRead && markAsRead(note.id)}
                className={`group relative overflow-hidden rounded-2xl p-5 border cursor-default transition-all duration-300 shadow-sm ${
                  !note.isRead 
                    ? 'bg-white dark:bg-slate-800 border-indigo-100 dark:border-indigo-500/30 hover:border-indigo-300 dark:hover:border-indigo-500/50' 
                    : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-white/5 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Unread indicator strip */}
                {!note.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-2xl"></div>
                )}
                
                <div className="flex items-start gap-4">
                  <div className={`mt-1 p-2.5 rounded-full shrink-0 ${!note.isRead ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <h3 className={`text-base truncate ${!note.isRead ? 'font-black text-slate-800 dark:text-white' : 'font-bold text-slate-600 dark:text-slate-300'}`}>
                        {note.title}
                      </h3>
                      <div className="flex items-center gap-1.5 shrink-0 text-xs font-semibold text-slate-400 dark:text-slate-500">
                        <CalendarClock className="w-3.5 h-3.5" />
                        {formatDate(note.createdAt)}
                      </div>
                    </div>
                    
                    <p className={`text-sm leading-relaxed ${!note.isRead ? 'text-slate-600 dark:text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                      {note.message}
                    </p>
                  </div>
                  
                  {/* Mark as read button (visible on hover if unread) */}
                  {!note.isRead && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); markAsRead(note.id); }}
                      title="Đánh dấu đã đọc"
                      className="shrink-0 p-2 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <Circle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
