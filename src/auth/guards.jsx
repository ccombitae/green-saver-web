import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

/** Rutas privadas: sin sesión → login; con rol equivocado → su propio panel. */
export function RequireRole({ role, children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/ingresar" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) return <Navigate to={homeFor(user)} replace />;
  return children;
}

export const homeFor = (user) => (user?.role === "admin" ? "/admin" : "/app");
