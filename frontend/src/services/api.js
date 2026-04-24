import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

const buildApiError = (error, fallbackDetail) => {
  const apiError = new Error(fallbackDetail);

  if (error.response) {
    apiError.detail = error.response.data?.detail || fallbackDetail;
    apiError.message = error.response.data?.detail || fallbackDetail;
    apiError.status = error.response.status;
    apiError.data = error.response.data;
    return apiError;
  }

  apiError.detail = fallbackDetail;
  apiError.status = null;
  return apiError;
};

// 🔹 LOGIN
export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE}/api/login`, {
      email,
      password
    });
    return response.data;
  } catch (error) {
    throw buildApiError(error, "Login failed");
  }
};

// 🔹 SIGNUP
export const signupUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE}/api/signup`, {
      email,
      password
    });
    return response.data;
  } catch (error) {
    throw buildApiError(error, "Signup failed");
  }
};

// 🔹 PREDICT (with token 🔥)
export const uploadFile = async (file, options = {}) => {
  const token = localStorage.getItem("token");

  if (!token) {
    const apiError = new Error("No authentication token found. Please login.");
    apiError.detail = "No authentication token found. Please login.";
    apiError.status = 401;
    throw apiError;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post(`${API_BASE}/api/predict`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: options.onUploadProgress,
    });
    return response.data;
  } catch (error) {
    throw buildApiError(error, "Upload failed");
  }
};

// 🔹 HISTORY
export const getHistory = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    const apiError = new Error("No authentication token found. Please login.");
    apiError.detail = "No authentication token found. Please login.";
    apiError.status = 401;
    throw apiError;
  }

  try {
    const response = await axios.get(`${API_BASE}/api/history`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw buildApiError(error, "Failed to get history");
  }
};

// 🔹 ADMIN: GET ALL USERS
export const getUsers = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    const apiError = new Error("No authentication token found. Please login.");
    apiError.status = 401;
    throw apiError;
  }

  try {
    const response = await axios.get(`${API_BASE}/api/admin/users`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw buildApiError(error, "Failed to get users list");
  }
};
