import React from 'react';

const Login = () => {
  const handleRedirect = () => {
    if (window.location.hostname === 'localhost') {
      // Nhảy sang cổng của app chấm công (thường là 5173, nếu landing page chạy cổng 5174)
      // Nếu landing page đang chạy cổng 5173, hãy sửa 5174 vào đây cho đúng cổng của app chính
      window.location.href = 'http://localhost:5174/login'; 
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', background: '#f8fafc' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '15px', color: '#1e293b' }}>Hệ thống Chấm công</h2>
        <p style={{ marginBottom: '30px', color: '#64748b' }}>Bạn đang ở giao diện Landing Page.</p>
        <button 
          onClick={handleRedirect}
          style={{ padding: '14px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}
        >
          Đi đến Đăng nhập phần mềm
        </button>
      </div>
    </div>
  );
};

export default Login;
