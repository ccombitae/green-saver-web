// Formulario de estimación (consumo + ciudad) y presentación del resultado.
// Lo usan la página pública de inicio y la calculadora del usuario.
import { useEffect, useMemo, useState } from "react";
import { ml } from "../api/endpoints";
import { cop, num } from "../utils/format";
import { SunStrip } from "./charts";
import { Field } from "./ui";

export function useCities() {
  const [cities, setCities] = useState([]);
  const [error, setError] = useState(null);
  useEffect(() => {
    ml.cities().then(setCities).catch(setError);
  }, []);
  return { cities, error };
}

export function CitySelect({ cities, value, onChange, id }) {
  const groups = useMemo(() => {
    const byDept = {};
    cities.forEach((c) => (byDept[c.departamento] = [...(byDept[c.departamento] || []), c]));
    return Object.entries(byDept).sort(([a], [b]) => (a === "Cundinamarca" ? -1 : b === "Cundinamarca" ? 1 : a.localeCompare(b, "es")));
  }, [cities]);
  return (
    <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)} disabled={!cities.length}>
      {!cities.length ? <option>Cargando ciudades…</option> : null}
      {groups.map(([dept, list]) => (
        <optgroup key={dept} label={dept}>
          {list.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

export function validConsumption(v) {
  const n = Number(String(v).replace(",", "."));
  if (!String(v).trim()) return "Escribe tu consumo mensual en kWh (aparece en tu recibo de luz).";
  if (!Number.isFinite(n) || n <= 0) return "El consumo debe ser un número mayor que cero.";
  if (n > 100000) return "Ese consumo es demasiado alto para una vivienda; revisa el valor.";
  return null;
}

export function EstimatorForm({ onResult, submitLabel = "Calcular", compact = false, initial }) {
  const { cities, error: citiesError } = useCities();
  const [consumption, setConsumption] = useState(initial?.consumption ?? "");
  const [cityId, setCityId] = useState(initial?.cityId ?? "girardot");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const problem = validConsumption(consumption);
    if (problem) return setError(problem);
    setError(null);
    setBusy(true);
    try {
      const value = Number(String(consumption).replace(",", "."));
      const result = await ml.estimate({ consumption: value, cityId });
      onResult?.(result, { consumption: value, cityId });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className={compact ? "calc-inputs" : "form-row"}>
        <Field label="Consumo mensual (kWh)" hint={compact ? null : "Lo encuentras en tu recibo de luz."}>
          {(id) => (
            <input
              id={id}
              className="input num"
              inputMode="decimal"
              placeholder="Ej. 250"
              value={consumption}
              onChange={(e) => setConsumption(e.target.value)}
              aria-invalid={Boolean(error)}
            />
          )}
        </Field>
        <Field label="Ciudad">{(id) => <CitySelect id={id} cities={cities} value={cityId} onChange={setCityId} />}</Field>
        {compact ? (
          <button className="btn btn-primary" disabled={busy || !cities.length}>
            {busy ? "Calculando…" : submitLabel}
          </button>
        ) : null}
      </div>
      {error ? (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      ) : null}
      {citiesError ? (
        <div className="alert alert-warn">No se pudo cargar la lista de ciudades: {citiesError.message}</div>
      ) : null}
      {!compact ? (
        <button className="btn btn-primary" disabled={busy || !cities.length}>
          {busy ? "Calculando…" : submitLabel}
        </button>
      ) : null}
    </form>
  );
}

const SOURCE = {
  modelo: "Radiación estimada por el modelo de aprendizaje automático con datos de NASA POWER.",
  historico: "Radiación según el promedio histórico de la ciudad (modelo no disponible).",
  respaldo: "Radiación de referencia nacional (sin datos de la ciudad).",
};

export function EstimateResult({ result, consumption }) {
  if (!result) return null;
  return (
    <section className="sunstrip" aria-label="Resultado de la estimación">
      <div className="sunstrip-head">
        <div>
          <div className="sunstrip-big">
            {result.paneles}
            <small>paneles de {num(result.parametros.potencia_panel_w, 0)} W</small>
          </div>
          <p className="muted" style={{ margin: "6px 0 0" }}>
            Para {num(consumption, 0)} kWh al mes en {result.ciudad?.nombre ?? "tu ciudad"}.
          </p>
        </div>
      </div>
      <div className="figures" style={{ margin: "20px 0 8px" }}>
        <div>
          <div className="figure-value">{num(result.potencia_kwp, 2)} kWp</div>
          <div className="figure-label">Potencia del sistema</div>
        </div>
        <div className="figure-sun">
          <div className="figure-value">{num(result.hsp_promedio, 2)}</div>
          <div className="figure-label">Horas solares pico al día</div>
        </div>
        <div>
          <div className="figure-value">{num(result.cobertura_anual_pct, 0)} %</div>
          <div className="figure-label">De tu consumo en el año</div>
        </div>
        <div>
          <div className="figure-value">{cop(result.ahorro_anual_cop)}</div>
          <div className="figure-label">Ahorro estimado al año</div>
        </div>
        <div>
          <div className="figure-value">{num(result.co2_evitado_kg_anual, 0)} kg</div>
          <div className="figure-label">CO₂ evitado al año</div>
        </div>
        <div>
          <div className="figure-value">{num(result.area_aprox_m2, 1)} m²</div>
          <div className="figure-label">Área aproximada de techo</div>
        </div>
      </div>
      <SunStrip months={result.detalle_mensual} consumption={consumption} />
      <p style={{ marginTop: 16 }}>{result.recomendacion}</p>
      <p className="small muted" style={{ margin: 0 }}>
        {SOURCE[result.fuente_hsp] ?? ""} Tarifa de referencia: {cop(result.parametros.tarifa_kwh_cop)} por kWh.
      </p>
    </section>
  );
}
