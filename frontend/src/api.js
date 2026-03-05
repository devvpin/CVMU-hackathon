import axios from "axios";
import { auth } from "./firebase";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // Backend URL
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
