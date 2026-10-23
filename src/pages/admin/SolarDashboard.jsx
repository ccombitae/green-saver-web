// Dashboard del análisis exploratorio de datos (EDA) y del modelo de ML.
// Datos: GET /ml/eda (agregados NASA POWER 2005-2024) y GET /ml/modelo.
import { useMemo, useState } from "react";
import { ml } from "../../api/endpoints";
import { PageHead } from "../../components/AppShell";
import { C, CloudScatter, CompareLines, CorrelationBars, RankingBars } from "../../components/charts";
import { ErrorNote, Loading, useAsync } from "../../components/ui";
import { num } from "../../utils/format";

const HOME = "girardot";
const COMPARE_COLORS = [C.blue, C.orange];

export default function SolarDashboard() {
  const { data, error, loading, reload } = useAsync(() => Promise.all([ml.eda(), ml.model()]), []);
  const [compare, setCompare] = useState(["riohacha", "quibdo"]);
  const [rankView, setRankView] = useState("top");

  const [eda, model] = data || [];
  const names = useMemo(() => Object.fromEntries((eda?.ranking_ciudades || []).map((c) => [c.ciudad_id, c.ciudad])), [eda]);

  if (loading) return <Loading text="Cargando el análisis…" />;
  if (error) return <ErrorNote error={error} onRetry={reload} />;

  const r = eda.resumen;
  const g = r.girardot;
  const metrics = model?.metricas_validacion || {};
  const base = metrics["Línea base (promedio del mes)"];
  const best = metrics[model?.modelo];
  const reduction = base && best ? Math.round((1 - best.mae / base.mae) * 100) : null;


  const lines = [
    { id: HOME, label: "Girardot", color: C.leaf, values: eda.perfil_mensual_por_ciudad[HOME] },
    ...compare.map((id, i) => ({ id, label: names[id], color: COMPARE_COLORS[i], values: eda.perfil_mensual_por_ciudad[id] })),
    { id: "nacional", label: "Promedio de las 49 ciudades", color: C.neutral, values: eda.perfil_mensual_nacional, dashed: true },
  ].filter((s) => s.values);

  const ranking = eda.ranking_ciudades;
  const rankItems = (rankView === "top" ? ranking.slice(0, 10) : rankView === "bottom" ? ranking.slice(-10) : ranking).map((c) => ({
    id: c.ciudad_id,
    label: c.ciudad,
    value: c.hsp_promedio,
  }));
  if (rankView !== "all" && !rankItems.some((i) => i.id === HOME)) {
    const gi = ranking.find((c) => c.ciudad_id === HOME);
    if (gi) rankItems.push({ id: HOME, label: `${gi.ciudad} (puesto ${g?.posicion_ranking})`, value: gi.hsp_promedio });
  }

  return (
    <>
      <PageHead title="Recurso solar en Colombia">
        Análisis exploratorio de {num(r.filas)} registros mensuales de {r.ciudades} ciudades ({r.periodo}), fuente NASA POWER, y desempeño del modelo que usa la calculadora.
      </PageHead>

      <section className="panel">
        <div className="figures">
          <div className="figure-sun">
            <div className="figure-value">{num(r.estadisticas_hsp.mean, 2)}</div>
            <div className="figure-label">Horas solares pico, promedio nacional</div>
          </div>
          {g ? (
            <div className="figure-sun">
              <div className="figure-value">{num(g.hsp_promedio, 2)}</div>
              <div className="figure-label">
                En Girardot, puesto {g.posicion_ranking} de {g.de}
              </div>
            </div>
          ) : null}
          {g ? (
            <div>
              <div className="figure-value">{g.mejor_mes}</div>
              <div className="figure-label">Mejor mes en Girardot (peor: {g.peor_mes})</div>
            </div>
          ) : null}
          {best ? (
            <div>
              <div className="figure-value">{num(best.mape_pct, 1)} %</div>
              <div className="figure-label">Error del modelo{reduction !== null ? `, ${reduction} % menos que sin ML` : ""}</div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Radiación mes a mes</h2>
          <span className="small muted">Girardot frente a dos ciudades que elijas y el promedio nacional.</span>
        </div>
        <div className="form-row" style={{ maxWidth: 560 }}>
          {[0, 1].map((slot) => (
            <div className="field" key={slot}>
              <label htmlFor={`comparar-${slot}`}>Comparar con</label>
              <select
                id={`comparar-${slot}`}
                className="input"
                value={compare[slot] ?? ""}
                onChange={(e) => {
                  const next = [...compare];
                  next[slot] = e.target.value;
                  setCompare(next.filter(Boolean));
                }}
              >
                <option value="">Ninguna</option>
                {ranking
                  .filter((c) => c.ciudad_id !== HOME && c.ciudad_id !== compare[1 - slot])
                  .map((c) => (
                    <option key={c.ciudad_id} value={c.ciudad_id}>
                      {c.ciudad} ({num(c.hsp_promedio, 2)})
                    </option>
                  ))}
              </select>
            </div>
          ))}
        </div>
        <CompareLines labels={eda.meses} series={lines} />
      </section>

      <div className="grid-2" style={{ marginTop: "var(--gap)" }}>
        <section className="panel">
          <div className="panel-head">
            <h2>Ranking de ciudades</h2>
            <div className="seg" role="group" aria-label="Vista del ranking">
              {[
                ["top", "Más sol"],
                ["bottom", "Menos sol"],
                ["all", "Todas"],
              ].map(([k, l]) => (
                <button key={k} aria-pressed={rankView === k} onClick={() => setRankView(k)}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <p className="small muted">Horas solares pico promedio 2005-2024. Girardot en verde oscuro.</p>
          <RankingBars items={rankItems} highlightId={HOME} />
        </section>

        <section className="panel">
          <h2>Nubosidad y radiación</h2>
          <p className="small muted">Cada punto es una ciudad. Girardot en amarillo. A más nubes, menos sol.</p>
          <CloudScatter
            highlightId={HOME}
            points={eda.nubosidad_vs_hsp.map((c) => ({ id: c.ciudad_id, label: c.ciudad, x: c.CLOUD_AMT, y: c.hsp }))}
          />
        </section>
      </div>

      <div className="grid-2" style={{ marginTop: "var(--gap)" }}>
        <section className="panel">
          <h2>¿Qué se relaciona con la radiación?</h2>
          <p className="small muted">Correlación de cada variable con las horas solares pico.</p>
          <CorrelationBars items={Object.entries(eda.correlacion_con_hsp).map(([label, value]) => ({ label, value })).sort((a, b) => a.value - b.value)} />
        </section>

        <section className="panel">
          <h2>Tendencia anual</h2>
          <p className="small muted">Promedio de las 49 ciudades por año.</p>
          <CompareLines
            labels={eda.tendencia_anual.anios.map(String)}
            series={[{ id: "anual", label: "Promedio nacional", color: C.leafBright, values: eda.tendencia_anual.hsp }]}
            height={240}
            tickDigits={2}
          />
        </section>
      </div>

      {best ? (
        <section className="panel" style={{ marginTop: "var(--gap)" }}>
          <h2>Modelo de aprendizaje automático</h2>
          <p className="muted">
            Se compararon {Object.keys(metrics).length - 1} algoritmos contra una línea base sin ML. La evaluación usa
            validación cruzada agrupada por zonas de 1°×1°: el modelo siempre se mide en regiones que no vio al entrenar.
          </p>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Modelo</th>
                  <th className="right">MAE (kWh/m²/día)</th>
                  <th className="right">RMSE</th>
                  <th className="right">R²</th>
                  <th className="right">Error porcentual</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(metrics)
                  .sort((a, b) => b[1].mae - a[1].mae)
                  .map(([name, m]) => (
                    <tr key={name} style={name === model.modelo ? { background: "var(--leaf-soft)", fontWeight: 600 } : undefined}>
                      <td>
                        {name}
                        {name === model.modelo ? " (en uso)" : ""}
                      </td>
                      <td className="right num">{num(m.mae, 3)}</td>
                      <td className="right num">{num(m.rmse, 3)}</td>
                      <td className="right num">{num(m.r2, 2)}</td>
                      <td className="right num">{num(m.mape_pct, 1)} %</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p className="small muted" style={{ marginTop: 12, marginBottom: 0 }}>
            Entrenado con {num(model.filas_entrenamiento)} registros, periodo {model.periodo}. Limitación: los datos solares de NASA POWER tienen resolución de 1°×1° (~110 km), por eso varias ciudades de Cundinamarca y Tolima comparten el mismo valor histórico.
          </p>
        </section>
      ) : null}
    </>
  );
}
