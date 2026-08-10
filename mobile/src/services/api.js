import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// LƯU Ý: Thay đổi IP này thành IP hoặc Tên miền VPS của bạn (vd: 123.45.67.89 hoặc api.tenmien.com)
// Không dùng localhost vì điện thoại thật / máy ảo sẽ hiểu sai
const API_URL = 'http://180.93.59.237:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
