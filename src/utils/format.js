const nf = (digits) => new Intl.NumberFormat("es-CO", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const num = (v, digits = 0) => (Number.isFinite(Number(v)) ? nf(digits).format(Number(v)) : "—");

export const cop = (v) =>
  Number.isFinite(Number(v))
    ? new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(v))
    : "—";

export const date = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
};

export const QUOTE_STATUS = {
  sent: { label: "Enviada", tone: "ok" },
  failed: { label: "Guardada sin correo", tone: "warn" },
  pending: { label: "Pendiente", tone: "neutral" },
  accepted: { label: "Aceptada", tone: "ok" },
};

export function validEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());
}

/** Contraseña: mínimo 8 caracteres, con letras y números. bcrypt usa como máximo 72 bytes. */
export function passwordProblem(v) {
  if (!v || v.length < 8) return "Usa al menos 8 caracteres.";
  if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return "Combina letras y números.";
  if (new TextEncoder().encode(v).length > 72) return "Es demasiado larga (máximo 72 bytes).";
  return null;
}
