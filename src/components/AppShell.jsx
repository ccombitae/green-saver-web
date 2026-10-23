import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Brand } from "./Brand";

const USER_NAV = [
  { to: "/app", label: "Inicio", end: true },
  { to: "/app/calcular", label: "Calcular sistema" },
  { to: "/app/historial", label: "Historial" },
  { to: "/app/mi-sistema", label: "Mi sistema" },
  { to: "/app/aprende", label: "Energía solar" },
  { to: "/app/perfil", label: "Perfil" },
];

const ADMIN_NAV = [
  { to: "/admin", label: "Resumen", end: true },
  { to: "/admin/usuarios", label: "Usuarios" },
  { to: "/admin/cotizaciones", label: "Cotizaciones" },
  { to: "/admin/estadisticas", label: "Estadísticas" },
  { to: "/admin/recurso-solar", label: "Recurso solar (EDA)" },
];

export default function AppShell({ area }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [location.pathname]);

  const items = area === "admin" ? ADMIN_NAV : USER_NAV;
  const exit = () => {
    logout();
    navigate("/ingresar");
  };

  return (
    <div className="shell">
      <header className="topbar">
        <Brand to={area === "admin" ? "/admin" : "/app"} />
        <button onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="menu-lateral">
          Menú
        </button>
      </header>
      <aside className={`rail ${open ? "open" : ""}`} id="menu-lateral">
        <Brand to={area === "admin" ? "/admin" : "/app"} />
        <nav aria-label="Navegación principal">
          <div className="nav-group">{area === "admin" ? "Administración" : "Mi cuenta"}</div>
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => `nav ${isActive ? "active" : ""}`}>
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="who">
          <strong>{user?.name || "Usuario"}</strong>
          {user?.email}
          <button className="btn btn-secondary btn-sm btn-block" onClick={exit}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="content" id="contenido">
        <Outlet />
      </main>
    </div>
  );
}

export function PageHead({ title, children, actions }) {
  return (
    <div className="page-head panel-head" style={{ alignItems: "flex-end" }}>
      <div>
        <h1>{title}</h1>
        {children ? <p className="muted">{children}</p> : null}
      </div>
      {actions}
    </div>
  );
}
