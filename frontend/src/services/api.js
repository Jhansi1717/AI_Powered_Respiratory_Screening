import axios from 'axios';

// 🔹 Smart API routing: Use local backend in development, Render in production
const API_BASE = window.location.hostname === "localhost" 
  ? "http://localhost:8000" 
  : "https://respiratory-ai-backend.onrender.com";

// 🔹 Wake backend from Render Free Tier hibernation
// Render spins down free instances after 15 min of inactivity.
// This sends a lightweight health ping to wake it before real requests.
export const wakeBackend = async () => {
  // Wait until the backend is not only reachable, but also has the model loaded.
  // This prevents protected requests from racing the Render cold start/model warmup.
  const maxAttempts = 30;
  const delayMs = 2000;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await axios.get(`${API_BASE}/api/health`, { timeout: 10000 });
      const healthy = response.data?.status === "healthy";
      const modelReady = response.data?.model_ready === true;

      if (healthy && modelReady) {
        return true;
      }
    } catch {
      // Backend may still be waking. Retry without surfacing a false network error.
    }

    if (attempt < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return false;
};

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

  const doPredict = async () => {
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
  };

  try {
    return await doPredict();
  } catch (error) {
    // On network error, the backend may be hibernating — wake it and retry once
    if (!error.response && error.code !== 'ECONNABORTED') {
      console.log("Backend may be hibernating. Waking up and retrying...");
      const awake = await wakeBackend();
      if (awake) {
        try {
          return await doPredict();
        } catch (retryError) {
          error = retryError; // fall through to normal error handling
        }
      }
    }

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
