import axios from 'axios';

// 🔹 Smart API routing: Use local backend in development, Render in production
const API_BASE = window.location.hostname === "localhost" 
  ? "http://localhost:8000" 
  : "https://respiratory-ai-backend.onrender.com";

const buildApiError = (error, fallbackDetail) => {
  const apiError = new Error(fallbackDetail);

  if (error.response) {
    let detail = error.response.data?.detail || fallbackDetail;
    
    // Handle FastAPI 422 Validation Errors (List of objects)
    if (Array.isArray(detail)) {
      detail = detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
    } else if (typeof detail === 'object') {
      detail = JSON.stringify(detail);
    }

    apiError.detail = detail;
    apiError.message = detail;
    apiError.status = error.response.status;
    apiError.data = error.response.data;
    
    // Add error type classification
    if (error.response.status >= 400 && error.response.status < 500) {
      apiError.type = error.response.status === 401 || error.response.status === 403 
        ? 'authentication' 
        : 'client';
    } else if (error.response.status >= 500) {
      apiError.type = 'server';
    }
    
    return apiError;
  }

  apiError.detail = fallbackDetail;
  apiError.status = null;
  apiError.type = 'network';
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
        Authorization: `Bearer ${token}`
        // NOTE: Do NOT manually set Content-Type for FormData.
        // The browser/axios will automatically set the correct multipart boundary.
      },
      onUploadProgress: options.onUploadProgress,
      timeout: 120000, // 120 second timeout to prevent infinite processing state
    });
    return response.data;
  } catch (error) {
    // Enhanced error handling for better debugging
    if (error.code === 'ECONNABORTED') {
      const timeoutError = new Error("Request timeout. The analysis took too long to complete.");
      timeoutError.detail = "Request timeout. The analysis took too long to complete.";
      timeoutError.status = null;
      throw timeoutError;
    }
    
    if (!error.response) {
      // Network error (no response from server)
      const networkError = new Error("Network error. Unable to connect to the server.");
      networkError.detail = "Network error. Unable to connect to the server.";
      networkError.status = null;
      throw networkError;
    }
    
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
