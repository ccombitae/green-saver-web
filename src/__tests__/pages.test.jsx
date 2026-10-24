import { CostDetails, EquipmentDetails } from "../components/Estimator";
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

describe("equipos recomendados", () => {
  it("muestra inversor, techo y baterías cuando la API los envía", () => {
    render(
      <EquipmentDetails
        result={{
          generacion_anual_kwh: 3718,
          rendimiento_especifico_kwh_kwp: 1352,
          inversor: { tipo: "Inversor de conexión a red (on-grid)", alternativa: "Híbrido", potencia_kw: 3, relacion_dc_ac: 0.92, conexion: "Monofásico" },
          instalacion: { area_paneles_m2: 12.9, area_techo_recomendada_m2: 16.1, peso_total_kg: 158, carga_kg_m2: 12.2, inclinacion_grados: 10, orientacion: "Hacia el sur", notas: ["Sin sombras."] },
          baterias: {
            tecnologia: "LiFePO4",
            nota: "Opcional.",
            respaldo_nocturno: { modulos: 1, capacidad_instalada_kwh: 5.12 },
            autonomia_un_dia: { modulos: 2, capacidad_instalada_kwh: 10.24 },
          },
        }}
      />
    );
    expect(screen.getByText("3 kW")).toBeInTheDocument();
    expect(screen.getByText("Hacia el sur")).toBeInTheDocument();
    expect(screen.getByText(/2 módulos/)).toBeInTheDocument();
  });

  it("no muestra nada si la API no envía equipos (versión anterior)", () => {
    const { container } = render(<EquipmentDetails result={{}} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("costo estimado", () => {
  it("muestra el total, el detalle y el retorno", () => {
    render(
      <CostDetails
        result={{
          costos: {
            total_cop: 8136363,
            costo_por_kwp_cop: 2958677,
            rango_mercado_cop: [7700000, 13750000],
            retorno_rango_anios: [3.0, 5.4],
            detalle: [
              { rubro: "Paneles", valor_cop: 2900000 },
              { rubro: "Mano de obra de instalación", valor_cop: 1336364 },
            ],
            respaldo_baterias: { costo_adicional_cop: 12314250 },
            mantenimiento_anual_cop: [300000, 800000],
            notas: ["Referencia."],
            fecha_precios: "octubre de 2026",
            fuentes: ["Autosolar Colombia (2026). Precios."],
          },
        }}
      />
    );
    expect(screen.getByText("Mano de obra de instalación")).toBeInTheDocument();
    expect(screen.getByText(/a 5,4 años/)).toBeInTheDocument();
  });
});
