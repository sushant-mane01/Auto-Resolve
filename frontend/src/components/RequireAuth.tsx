import { Navigate, useLocation } from "react-router-dom";
import { useAuth, type Role } from "@/store/auth";

export const RequireAuth = ({ children, role }: { children: React.ReactNode; role?: Role }) => {
  const { user, token } = useAuth();
  const location = useLocation();
  if (!token || !user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
};
