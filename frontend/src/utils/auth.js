/**
 * Authentication utility functions
 * Handles JWT token storage and retrieval from localStorage
 */

// Token storage key
const TOKEN_KEY = 'token';

/**
 * Store JWT token in localStorage
 * @param {string} token - JWT token to store
 */
export const setToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

/**
 * Retrieve JWT token from localStorage
 * @returns {string|null} JWT token or null if not found
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Remove JWT token from localStorage
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Check if user is authenticated (has valid token)
 * @returns {boolean} True if token exists, false otherwise
 */
export const isAuthenticated = () => {
  const token = getToken();
  return !!token; // Returns true if token exists and is not empty
};

/**
 * Get user info from token (basic implementation)
 * Note: In production, you might want to decode the JWT token
 * @returns {object|null} User info or null
 */
export const getUserInfo = () => {
  const token = getToken();
  if (!token) return null;

  try {
    // Basic implementation - in production you'd decode the JWT
    // For now, just return that user is authenticated
    return {
      authenticated: true,
      token: token
    };
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
};

/**
 * Logout user by removing token
 */
export const logout = () => {
  removeToken();
};

/**
 * Check if token exists and redirect if not authenticated
 * @param {string} redirectPath - Path to redirect to if not authenticated
 * @returns {boolean} True if authenticated, false otherwise
 */
export const requireAuth = (redirectPath = '/login') => {
  if (!isAuthenticated()) {
    window.location.href = redirectPath;
    return false;
  }
  return true;
};