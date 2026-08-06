import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import EmployeeView from './pages/EmployeeView';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeManagement from './pages/EmployeeManagement';
import ShiftManagement from './pages/ShiftManagement';
import Profile from './pages/Profile';
import AttendanceHistory from './pages/AttendanceHistory';
import LeaveRequest from './pages/LeaveRequest';
import RequestManagement from './pages/RequestManagement';
import Login from './pages/Login';

// Component để bảo vệ các Route cần đăng nhập
const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== 'admin') return <Navigate to="/employee" replace />;
  return children;
};

import EmployeeLayout from './layouts/EmployeeLayout';
import EmployeeRequests from './pages/EmployeeRequests';
import EmployeeHistory from './pages/EmployeeHistory';
import EmployeeProfile from './pages/EmployeeProfile';
import EmployeeSettings from './pages/EmployeeSettings';
import EmployeeNotifications from './pages/EmployeeNotifications';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang đăng nhập */}
        <Route path="/login" element={<Login />} />
        
        {/* Chuyển hướng thư mục gốc */}
        <Route path="/" element={<Navigate to="/employee" replace />} />
        
        {/* Route dành cho nhân viên (cần đăng nhập) */}
        <Route path="/employee" element={<PrivateRoute><EmployeeLayout /></PrivateRoute>}>
          <Route index element={<EmployeeView />} />
          <Route path="requests" element={<EmployeeRequests />} />
          <Route path="history" element={<EmployeeHistory />} />
          <Route path="notifications" element={<EmployeeNotifications />} />
          <Route path="profile" element={<EmployeeProfile />} />
          <Route path="settings" element={<EmployeeSettings />} />
        </Route>
        
        {/* Route dành cho quản lý (cần đăng nhập và quyền admin) */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/employees" element={<AdminRoute><EmployeeManagement /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><ShiftManagement /></AdminRoute>} />
        <Route path="/admin/requests" element={<AdminRoute><RequestManagement /></AdminRoute>} />
        
        {/* Cũ (Legacy) - Tạm giữ lại hoặc xoá đi tuỳ ý */}
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/requests" element={<PrivateRoute><LeaveRequest /></PrivateRoute>} />
        <Route path="/history" element={<PrivateRoute><AttendanceHistory /></PrivateRoute>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/employee" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
