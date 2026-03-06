import axios from "axios";
import { auth } from "./firebase";

/**
 * Web production: use same-origin `/api` (backend serves frontend + API).
 * Web dev (Vite): use proxy configured in `vite.config.js` to forward `/api` to backend.
 *
 * If you truly need a different API host (rare), set `VITE_API_BASE_URL`
 * to something like `https://your-domain.com/api`.
 */
const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL,
});

// Add a request interceptor to attach the Firebase token
api.interceptors.request.use(
  async (config) => {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export const aiCategorize = async (text) => {
  const response = await api.post("/ai/categorize", { text });
  return response.data;
};

export const aiScanReceipt = async (imageBase64, mimeType) => {
  const response = await api.post("/ai/scan-receipt", { imageBase64, mimeType });
  return response.data;
};

export const aiGetInsights = async (transactions, budgets) => {
  const response = await api.post("/ai/insights", { transactions, budgets });
  return response.data;
};

// User profile functions
export const checkUsernameAvailability = async (username) => {
  const response = await api.get(`/users/check-username/${username}`);
  return response.data;
};

export const createUserProfile = async (profileData) => {
  const response = await api.post("/users/profile", profileData);
  return response.data;
};

export const getUserProfile = async () => {
  const response = await api.get("/users/profile");
  return response.data;
};

export const updateUserProfile = async (profileData) => {
  const response = await api.patch("/users/profile", profileData);
  return response.data;
};

export const updateUsername = async (newUsername) => {
  const response = await api.patch("/users/username", { newUsername });
  return response.data;
};

export default api;
