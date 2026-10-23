import { describe, expect, it } from "vitest";
import { errorMessage } from "../api/client";
import { mapCalculation, mapQuote, mapUser } from "../api/endpoints";
import { validConsumption } from "../components/Estimator";
import { cop, num, passwordProblem, validEmail } from "../utils/format";

describe("formato", () => {
  it("usa formato colombiano para números y pesos", () => {
    expect(num(4.6512, 2)).toBe("4,65");
    expect(num(11760)).toBe("11.760");
    expect(cop(2550000).replace(/\s/g, " ")).toMatch(/2\.550\.000/);
    expect(num("abc")).toBe("—");
  });
  it("valida correos", () => {
    expect(validEmail("ana@prueba.com")).toBe(true);
    expect(validEmail("ana@prueba")).toBe(false);
    expect(validEmail("sin arroba")).toBe(false);
  });
  it("exige contraseñas de 8+ caracteres con letras y números", () => {
    expect(passwordProblem("corta1")).toMatch(/8 caracteres/);
    expect(passwordProblem("solamenteletras")).toMatch(/letras y números/);
    expect(passwordProblem("Clave1234")).toBeNull();
    expect(passwordProblem("a1" + "x".repeat(80))).toMatch(/72 bytes/);
  });
  it("valida el consumo mensual", () => {
    expect(validConsumption("")).toMatch(/recibo de luz/);
    expect(validConsumption("-5")).toMatch(/mayor que cero/);
    expect(validConsumption("abc")).toMatch(/mayor que cero/);
    expect(validConsumption("250")).toBeNull();
    expect(validConsumption("250,5")).toBeNull();
  });
});

describe("errores de la API", () => {
  it("lee el detalle de FastAPI", () => {
    expect(errorMessage({ detail: "Credenciales incorrectas" }, 401)).toBe("Credenciales incorrectas");
  });
  it("une errores de validación de Pydantic con el campo", () => {
    const msg = errorMessage({ detail: [{ loc: ["body", "consumo_mensual_kwh"], msg: "debe ser mayor que 0" }] }, 422);
    expect(msg).toBe("consumo_mensual_kwh: debe ser mayor que 0");
  });
  it("explica la falta de conexión", () => {
    expect(errorMessage(null, 0)).toMatch(/conexión/);
  });
});

describe("normalización de respuestas", () => {
  it("acepta columnas en camelCase o en minúscula", () => {
    expect(mapCalculation({ id: 1, estimatedPanels: 5, consumption: "250" }).panels).toBe(5);
    expect(mapCalculation({ id: 2, estimatedpanels: 7 }).panels).toBe(7);
    expect(mapCalculation({ id: 2, estimatedpanels: 7 }).consumption).toBe(0);
  });
  it("traduce usuarios y cotizaciones", () => {
    expect(mapUser({ id: 3, nombre: "Ana", rol: "user", telefono: "300" })).toMatchObject({ name: "Ana", role: "user", phone: "300" });
    expect(mapQuote({ id: 9, total_price: "1500", client_email: "a@b.co", status: "sent" })).toMatchObject({ totalPrice: 1500, clientEmail: "a@b.co" });
  });
});
