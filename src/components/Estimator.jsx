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
          <div className="figure-value">{num(result.instalacion?.area_techo_recomendada_m2 ?? result.area_aprox_m2, 1)} m²</div>
          <div className="figure-label">Área de techo recomendada</div>
        </div>
      </div>
      <SunStrip months={result.detalle_mensual} consumption={consumption} />
      <p style={{ marginTop: 16 }}>{result.recomendacion}</p>
      <EquipmentDetails result={result} />
      <CostDetails result={result} />
      <p className="small muted" style={{ margin: 0 }}>
        {SOURCE[result.fuente_hsp] ?? ""} Tarifa de referencia: {cop(result.parametros.tarifa_kwh_cop)} por kWh.
      </p>
    </section>
  );
}

/** Inversor, instalación en el techo y baterías opcionales (predimensionamiento). */
export function EquipmentDetails({ result }) {
  const inv = result.inversor;
  const ins = result.instalacion;
  const bat = result.baterias;
  if (!inv || !ins || !bat) return null;
  return (
    <div className="equip">
      <h3 className="equip-title">Equipos e instalación recomendados</h3>
      <div className="equip-grid">
        <article className="equip-card">
          <h4>Inversor</h4>
          <p className="equip-big">{num(inv.potencia_kw, inv.potencia_kw % 1 ? 1 : 0)} kW</p>
          <dl className="kv small">
            <dt>Tipo</dt>
            <dd>{inv.tipo}</dd>
            <dt>Conexión</dt>
            <dd>{inv.conexion}</dd>
            <dt>Relación DC/AC</dt>
            <dd>{num(inv.relacion_dc_ac, 2)}</dd>
          </dl>
          <p className="small muted">{inv.alternativa}.</p>
        </article>
        <article className="equip-card">
          <h4>En tu techo</h4>
          <p className="equip-big">{num(ins.area_techo_recomendada_m2, 1)} m²</p>
          <dl className="kv small">
            <dt>Área de paneles</dt>
            <dd>{num(ins.area_paneles_m2, 1)} m²</dd>
            <dt>Inclinación</dt>
            <dd>{ins.inclinacion_grados}°</dd>
            <dt>Orientación</dt>
            <dd>{ins.orientacion}</dd>
            <dt>Peso total</dt>
            <dd>
              {num(ins.peso_total_kg, 0)} kg ({num(ins.carga_kg_m2, 1)} kg/m²)
            </dd>
            <dt>Producción al año</dt>
            <dd>
              {num(result.generacion_anual_kwh, 0)} kWh ({num(result.rendimiento_especifico_kwh_kwp, 0)} kWh por kWp)
            </dd>
          </dl>
        </article>
        <article className="equip-card">
          <h4>Baterías (opcional)</h4>
          <p className="small muted" style={{ marginTop: 0 }}>{bat.tecnologia}</p>
          <dl className="kv small">
            <dt>Respaldo nocturno</dt>
            <dd>
              {bat.respaldo_nocturno.modulos} módulo{bat.respaldo_nocturno.modulos > 1 ? "s" : ""} ·{" "}
              {num(bat.respaldo_nocturno.capacidad_instalada_kwh, 2)} kWh
            </dd>
            <dt>Un día de autonomía</dt>
            <dd>
              {bat.autonomia_un_dia.modulos} módulo{bat.autonomia_un_dia.modulos > 1 ? "s" : ""} ·{" "}
              {num(bat.autonomia_un_dia.capacidad_instalada_kwh, 2)} kWh
            </dd>
          </dl>
          <p className="small muted">{bat.nota}</p>
        </article>
      </div>
      <ul className="equip-notes small muted">
        {ins.notas.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </div>
  );
}

/** Costo estimado del sistema, rango de mercado y retorno simple. */
export function CostDetails({ result }) {
  const c = result.costos;
  if (!c) return null;
  const [rMin, rMax] = c.retorno_rango_anios || [];
  return (
    <div className="equip">
      <h3 className="equip-title">Costo estimado</h3>
      <div className="equip-card">
        <p className="equip-big" style={{ marginBottom: 2 }}>
          {cop(c.total_cop)}
        </p>
        <p className="small muted" style={{ marginTop: 0 }}>
          {cop(c.costo_por_kwp_cop)} por kWp · Rango de mercado para este tamaño: {cop(c.rango_mercado_cop[0])} a{" "}
          {cop(c.rango_mercado_cop[1])}
        </p>
        <table className="data cost-table">
          <tbody>
            {c.detalle.map((r) => (
              <tr key={r.rubro}>
                <td>{r.rubro}</td>
                <td className="right num">{cop(r.valor_cop)}</td>
              </tr>
            ))}
            <tr className="cost-total">
              <td>Total estimado</td>
              <td className="right num">{cop(c.total_cop)}</td>
            </tr>
          </tbody>
        </table>
        <dl className="kv small" style={{ marginTop: 12 }}>
          <dt>Recuperas la inversión en</dt>
          <dd>
            {rMin != null && rMax != null ? `${num(rMin, 1)} a ${num(rMax, 1)} años` : "N/D"} (retorno simple)
          </dd>
          <dt>Con respaldo de baterías</dt>
          <dd>+ {cop(c.respaldo_baterias.costo_adicional_cop)}</dd>
          <dt>Mantenimiento al año</dt>
          <dd>
            {cop(c.mantenimiento_anual_cop[0])} a {cop(c.mantenimiento_anual_cop[1])}
          </dd>
        </dl>
      </div>
      <ul className="equip-notes small muted">
        {c.notas.map((n) => (
          <li key={n}>{n}</li>
        ))}
        <li>
          Precios de referencia consultados en {c.fecha_precios}: {c.fuentes.map((f) => f.split(" (")[0]).join(", ")}.
        </li>
      </ul>
    </div>
  );
}
