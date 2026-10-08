import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 120000,
});

api.interceptors.request.use((config) => {
  const { token, access_token } = useAuthStore.getState();
  const authToken = token || access_token;

  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail || error.message || 'Erreur inconnue';

    console.error(`API Error [${status}]:`, detail);

    if (status === 401) {
      toast.error("Session expirée. Veuillez vous reconnecter.");
      useAuthStore.getState().logout();
    } else {
      toast.error(String(detail));
    }

    return Promise.reject(error);
  }
);

export default api;