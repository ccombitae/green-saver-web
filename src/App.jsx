import { Navigate, Route, Routes } from "react-router-dom";
import { RequireRole } from "./auth/guards";
import AppShell from "./components/AppShell";
import { AdminHome, Quotes, Statistics, Users } from "./pages/admin/AdminPages";
import SolarDashboard from "./pages/admin/SolarDashboard";
import { Login, NotFound, Recover, Register } from "./pages/public/AuthPages";
import Landing from "./pages/public/Landing";
import { Calculator, History, HistoryDetail, Learn, MySystem, Profile, UserHome } from "./pages/user/UserPages";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/ingresar" element={<Login />} />
      <Route path="/registro" element={<Register />} />
      <Route path="/recuperar" element={<Recover />} />

      <Route
        path="/app"
        element={
          <RequireRole role="user">
            <AppShell area="user" />
          </RequireRole>
        }
      >
        <Route index element={<UserHome />} />
        <Route path="calcular" element={<Calculator />} />
        <Route path="historial" element={<History />} />
        <Route path="historial/:id" element={<HistoryDetail />} />
        <Route path="mi-sistema" element={<MySystem />} />
        <Route path="aprende" element={<Learn />} />
        <Route path="perfil" element={<Profile />} />
      </Route>

      <Route
        path="/admin"
        element={
          <RequireRole role="admin">
            <AppShell area="admin" />
          </RequireRole>
        }
      >
        <Route index element={<AdminHome />} />
        <Route path="usuarios" element={<Users />} />
        <Route path="cotizaciones" element={<Quotes />} />
        <Route path="estadisticas" element={<Statistics />} />
        <Route path="recurso-solar" element={<SolarDashboard />} />
      </Route>

      <Route path="/login" element={<Navigate to="/ingresar" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
