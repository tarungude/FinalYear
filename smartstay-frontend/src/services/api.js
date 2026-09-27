import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach the JWT to every request if we have one stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("smartstay_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If a request comes back unauthorized, clear the stale session.
// (Left minimal on purpose — the AuthContext owns the actual redirect logic.)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("smartstay_token");
      localStorage.removeItem("smartstay_user");
    }
    return Promise.reject(error);
  }
);

export default api;
