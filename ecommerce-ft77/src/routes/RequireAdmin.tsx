import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/auth/useAuth";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className="empty-message" role="status">Cargando sesión…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (profile?.role !== "admin") return <Navigate to="/" replace />;
  return children;
}
