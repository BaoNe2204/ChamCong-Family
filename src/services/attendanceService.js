import { api } from './api';

export const checkIn = async (userId, userName) => {
  return await api.post('/attendance/checkin', {});
};

export const checkOut = async (userId) => {
  return await api.post('/attendance/checkout', {});
};

export const getAttendanceToday = async (userId) => {
  return await api.get('/attendance/today');
};

export const getAttendanceHistory = async (userId) => {
  return await api.get('/attendance/history'); // Note: You need to implement this in server.js if needed by EmployeeView
};
