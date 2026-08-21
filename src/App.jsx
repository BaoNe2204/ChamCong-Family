import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import EmployeeView from './pages/EmployeeView';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeManagement from './pages/EmployeeManagement';
import SystemSettings from './pages/SystemSettings';
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
import ShiftCrud from './pages/ShiftCrud';
import EmployeeNotifications from './pages/EmployeeNotifications';
import AdminLayout from './layouts/AdminLayout';
import AdminCalendarView from './pages/AdminCalendarView';
import AdminPayroll from './pages/AdminPayroll';
import AdminTimesheet from './pages/AdminTimesheet';
import AdminOvertime from './pages/AdminOvertime';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang đăng nhập */}
        <Route path="/login" element={<Login />} />
        
        {/* Chuyển hướng thư mục gốc về Đăng nhập (theo yêu cầu) */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Landing Page Route */}
        <Route path="/trang-chu" element={<LandingPage />} />
        
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
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="employees" element={<EmployeeManagement />} />
          <Route path="settings" element={<SystemSettings />} />
          <Route path="shifts" element={<ShiftCrud />} />
          <Route path="calendar" element={<AdminCalendarView />} />
          <Route path="timesheet" element={<AdminTimesheet />} />
          <Route path="overtime" element={<AdminOvertime />} />
          <Route path="payroll" element={<AdminPayroll />} />
          <Route path="requests" element={<RequestManagement />} />
        </Route>
        
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
