import { Navigate } from "react-router-dom";
import { decodeToken } from "../utils/token";
import { getToken, removeToken } from "../utils/auth";

const isTokenValid = (token) => {
  const payload = decodeToken(token);
  if (!payload || typeof payload.exp !== "number") return false;
  return payload.exp * 1000 > Date.now();
};

/**
 * ProtectedRoute component that checks authentication before rendering children.
 * Redirects to login if the JWT is missing, malformed, or expired.
 */
const ProtectedRoute = ({ children }) => {
  const token = getToken();

  if (!token || !isTokenValid(token)) {
    if (token) removeToken();
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
