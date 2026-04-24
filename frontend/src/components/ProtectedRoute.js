import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute component that checks authentication before rendering children
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
