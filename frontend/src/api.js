import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor untuk menyertakan Bearer token otomatis
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sadaya_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor untuk menangani error response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token tidak valid/kedaluwarsa
      // localStorage.removeItem('sadaya_token');
      // localStorage.removeItem('sadaya_user');
    }
    return Promise.reject(error);
  }
);

export default api;
