// Funciones por recurso de la API. Normalizan las respuestas para que las
// páginas trabajen siempre con el mismo formato.
import { api } from "./client";

const unwrap = (payload) => (payload && Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : payload?.data ?? payload);

// ------------------------------------------------------------------ sesión
export const auth = {
  login: (email, password) => api("/auth/login", { method: "POST", body: { email, password }, auth: false }),
  register: ({ name, phone, email, password }) =>
    api("/auth/register", { method: "POST", body: { name, phone, email, password }, auth: false }),
  recover: (email, newPassword) =>
    api("/auth/recover-password", { method: "POST", body: { email, newPassword }, auth: false }),
  me: () => api("/auth/me"),
};

// --------------------------------------------------------- machine learning
export const ml = {
  cities: () => api("/ml/ciudades", { auth: false }),
  estimate: ({ consumption, cityId, panelW, tariff }) =>
    api("/ml/estimar", {
      method: "POST",
      auth: false,
      body: {
        consumo_mensual_kwh: Number(consumption),
        ciudad_id: cityId,
        ...(panelW ? { potencia_panel_w: Number(panelW) } : {}),
        ...(tariff ? { tarifa_kwh_cop: Number(tariff) } : {}),
      },
    }),
  model: () => api("/ml/modelo", { auth: false }),
  eda: () => api("/ml/eda", { auth: false }),
};

// --------------------------------------------------------------- cálculos
export const mapCalculation = (c) => ({
  id: c.id,
  email: c.email,
  clientName: c.client_name ?? c.clientName ?? c.email,
  consumption: Number(c.consumption ?? 0),
  panels: Number(c.estimatedPanels ?? c.estimatedpanels ?? 0),
  coverage: Number(c.coverage ?? 0),
  savings: Number(c.estimatedSavings ?? c.estimatedsavings ?? 0),
  recommendation: c.recommendation ?? "",
  createdAt: c.created_at ?? c.createdAt ?? null,
});

export const calculations = {
  list: async () => (await api("/calculos")).map(mapCalculation),
  create: ({ email, consumption, panels, coverage, savings, recommendation }) =>
    api("/calculos", {
      method: "POST",
      body: {
        email,
        consumption: Number(consumption),
        estimatedPanels: Math.round(panels),
        coverage: Number(coverage),
        estimatedSavings: Number(savings),
        recommendation,
      },
    }),
};

// ---------------------------------------------------------------- sistemas
export const systems = {
  mine: async (email) => unwrap(await api("/systems", { query: { email } }))?.[0] ?? null,
  assign: (email, system) => api("/systems/assign", { method: "POST", body: { email, system } }),
};

// ---------------------------------------------------------------- usuarios
export const mapUser = (u) => ({
  id: u.id,
  name: u.nombre ?? u.name ?? "",
  email: u.email ?? "",
  phone: u.telefono ?? u.phone ?? "",
  role: u.rol ?? u.role ?? "user",
  createdAt: u.created_at ?? null,
});

export const users = {
  list: async () => (await api("/usuarios")).map(mapUser),
  remove: (id) => api(`/usuarios/${id}`, { method: "DELETE" }),
};

// ------------------------------------------------------------ cotizaciones
export const mapQuote = (q) => ({
  id: q.id,
  calculationId: q.calculation_id,
  clientEmail: q.client_email,
  clientName: q.client_name,
  totalPrice: Number(q.total_price ?? 0),
  notes: q.notes ?? "",
  materials: q.materials ?? {},
  status: q.status,
  sentAt: q.sent_at,
  acceptedAt: q.accepted_at,
  installDate: q.installation_date,
});

export const quotes = {
  calculations: async () => unwrap(await api("/quotes/calculations")).map(mapCalculation),
  options: async () => unwrap(await api("/quotes/options")),
  list: async () => unwrap(await api("/quotes")).map(mapQuote),
  send: (payload) => api("/quotes/send", { method: "POST", body: payload }),
  accept: (id, installDate) => api(`/quotes/${id}/accept`, { method: "POST", body: { installDate } }),
};
