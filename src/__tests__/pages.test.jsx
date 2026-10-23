import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth/AuthContext";
import { RequireRole } from "../auth/guards";
import { Login, Register } from "../pages/public/AuthPages";
import { ToastProvider } from "../components/ui";

const wrap = (ui, path = "/") =>
  render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>{ui}</ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("acceso por roles", () => {
  it("sin sesión, una ruta privada lleva a ingresar", () => {
    wrap(
      <Routes>
        <Route path="/admin" element={<RequireRole role="admin"><p>Panel admin</p></RequireRole>} />
        <Route path="/ingresar" element={<p>Pantalla de ingreso</p>} />
      </Routes>,
      "/admin"
    );
    expect(screen.getByText("Pantalla de ingreso")).toBeInTheDocument();
  });

  it("un usuario normal no entra al panel de administración", () => {
    localStorage.setItem("greensaver-web-session", JSON.stringify({ user: { role: "user", email: "a@b.co" }, token: "t" }));
    wrap(
      <Routes>
        <Route path="/admin" element={<RequireRole role="admin"><p>Panel admin</p></RequireRole>} />
        <Route path="/app" element={<p>Panel de usuario</p>} />
      </Routes>,
      "/admin"
    );
    expect(screen.getByText("Panel de usuario")).toBeInTheDocument();
  });
});

describe("formularios", () => {
  it("el login valida antes de llamar a la API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    wrap(<Login />);
    await userEvent.click(screen.getByRole("button", { name: "Ingresar" }));
    expect(screen.getByText(/correo válido/)).toBeInTheDocument();
    expect(screen.getByText("Escribe tu contraseña.")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("el login muestra un mensaje claro si las credenciales no coinciden", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ detail: "Credenciales incorrectas" }), { status: 401 }));
    wrap(<Login />);
    await userEvent.type(screen.getByLabelText("Correo"), "ana@prueba.com");
    await userEvent.type(screen.getByLabelText("Contraseña"), "mala");
    await userEvent.click(screen.getByRole("button", { name: "Ingresar" }));
    expect(await screen.findByText("El correo o la contraseña no coinciden.")).toBeInTheDocument();
  });

  it("el registro exige que las contraseñas coincidan", async () => {
    wrap(<Register />);
    await userEvent.type(screen.getByLabelText("Nombre completo"), "Ana Prueba");
    await userEvent.type(screen.getByLabelText("Teléfono"), "3001234567");
    await userEvent.type(screen.getByLabelText("Correo"), "ana@prueba.com");
    await userEvent.type(screen.getByLabelText("Contraseña"), "Clave1234");
    await userEvent.type(screen.getByLabelText("Confirmar contraseña"), "Clave9999");
    await userEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));
    expect(screen.getByText("Las contraseñas no coinciden.")).toBeInTheDocument();
  });
});
