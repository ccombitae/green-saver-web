// Gráficas del sitio. Un solo eje Y por gráfica, cuadrícula tenue, texto en
// colores de texto y valores visibles al pasar el puntero o enfocar con teclado.
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { num } from "../utils/format";

export const C = {
  leaf: "#0E6B45",
  leafBright: "#00A859",
  leafPale: "#A9D7BD",
  sun: "#F2B21B",
  sunInk: "#8A5A00",
  ink: "#14231B",
  ink2: "#4A5B52",
  grid: "#E3EBE5",
  blue: "#2A78D6",
  orange: "#EB6834",
  red: "#C2362B",
  neutral: "#6F7F76",
};

const axis = { fontSize: 12, fill: C.ink2 };

function Tip({ active, payload, label, unit = "", digits = 2, labelFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <strong>{labelFormatter ? labelFormatter(label, payload) : label}</strong>
      {payload.map((p) => (
        <div key={p.dataKey + p.name}>
          <span style={{ color: p.color || p.fill }}>■</span> {p.name}: <b className="num">{num(p.value, digits)}</b> {unit}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Franja solar
   12 meses. Arriba, un sol cuyo tamaño es la radiación (HSP) del mes; abajo, la
   generación del sistema contra la línea de consumo del hogar. */
export function SunStrip({ months, consumption }) {
  const [active, setActive] = useState(null);
  if (!months?.length) return null;
  const W = 720, H = 256, top = 78, base = 216, colW = W / 12;
  const maxGen = Math.max(consumption, ...months.map((m) => m.generacion_kwh)) * 1.08;
  // Área del sol proporcional a la radiación (escala desde cero, sin exagerar
  // diferencias pequeñas). 7 HSP ≈ el máximo observado en Colombia.
  const sunR = (h) => 17 * Math.sqrt(Math.max(h, 0) / 7);
  const y = (v) => base - (v / maxGen) * (base - top);
  const sel = active ?? months.reduce((lo, m, i) => (m.generacion_kwh < months[lo].generacion_kwh ? i : lo), 0);
  const m = months[sel];

  return (
    <figure style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Generación estimada y radiación solar de cada mes" style={{ width: "100%", height: "auto" }}>
        <line x1="0" x2={W} y1={base} y2={base} stroke={C.grid} />
        {months.map((mo, i) => {
          const cx = i * colW + colW / 2;
          const covered = mo.cobertura_pct >= 100;
          return (
            <g
              key={mo.mes}
              tabIndex={0}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              style={{ cursor: "pointer", outline: "none" }}
              aria-label={`${mo.mes}: ${num(mo.generacion_kwh, 0)} kWh, ${num(mo.hsp, 2)} horas solares pico`}
            >
              <rect x={i * colW} y="0" width={colW} height={H} fill={i === sel ? "#F1F7F3" : "transparent"} />
              <circle cx={cx} cy={28} r={sunR(mo.hsp)} fill={C.sun} opacity={i === sel ? 1 : 0.85} />
              <text x={cx} y={58} textAnchor="middle" fontSize="11" fill={C.sunInk}>
                {num(mo.hsp, 1)}
              </text>
              <rect
                x={cx - colW * 0.28}
                y={y(mo.generacion_kwh)}
                width={colW * 0.56}
                height={base - y(mo.generacion_kwh)}
                rx="4"
                fill={covered ? C.leafBright : C.leafPale}
              />
              <text x={cx} y={H - 18} textAnchor="middle" fontSize="13" fill={i === sel ? C.ink : C.ink2} fontWeight={i === sel ? 700 : 400}>
                {mo.mes}
              </text>
            </g>
          );
        })}
        <line x1="0" x2={W} y1={y(consumption)} y2={y(consumption)} stroke={C.ink} strokeWidth="2" strokeDasharray="6 5" pointerEvents="none" />
      </svg>
      <figcaption className="small" aria-live="polite" style={{ marginTop: 6 }}>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          <span>
            <b>{m.mes}</b>: {num(m.generacion_kwh, 0)} kWh generados
          </span>
          <span>{num(m.hsp, 2)} horas solares pico</span>
          <span>{num(m.cobertura_pct, 0)} % de tu consumo</span>
        </div>
        <div className="legend" style={{ marginTop: 8 }}>
          <span><i style={{ background: C.sun, borderRadius: "50%" }} />Radiación del mes (horas solares pico)</span>
          <span><i style={{ background: C.leafBright }} />Generación estimada</span>
          <span><i className="dash" style={{ background: C.ink }} />Tu consumo: {num(consumption, 0)} kWh</span>
          {months.some((x) => x.cobertura_pct < 100) ? <span><i style={{ background: C.leafPale }} />Mes que no cubre todo el consumo</span> : null}
        </div>
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------- Líneas comparadas */
export function CompareLines({ labels, series, unit = "HSP", height = 280, digits = 2, tickDigits = 1 }) {
  const data = labels.map((label, i) => {
    const row = { label };
    series.forEach((s) => (row[s.id] = s.values[i]));
    return row;
  });
  return (
    <>
      <div className="legend">
        {series.map((s) => (
          <span key={s.id}>
            <i className={s.dashed ? "dash" : ""} style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={{ stroke: C.grid }} />
          <YAxis tick={axis} tickLine={false} axisLine={false} domain={["auto", "auto"]} tickFormatter={(v) => num(v, tickDigits)} />
          <Tooltip content={<Tip unit={unit} digits={digits} />} />
          {series.map((s) => (
            <Line
              key={s.id}
              dataKey={s.id}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.dashed ? "6 5" : undefined}
              dot={false}
              activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}

/* ------------------------------------------------------- Barras horizontales */
export function RankingBars({ items, highlightId, unit = "HSP", digits = 2, color = C.leafPale, highlight = C.leaf }) {
  const height = Math.max(160, items.length * 26 + 30);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={items} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }} barCategoryGap={4}>
        <CartesianGrid stroke={C.grid} horizontal={false} />
        <XAxis type="number" tick={axis} tickLine={false} axisLine={false} domain={[0, (max) => Math.ceil(max)]} tickFormatter={(v) => num(v, 0)} />
        <YAxis type="category" dataKey="label" tick={axis} tickLine={false} axisLine={false} width={150} />
        <Tooltip content={<Tip unit={unit} digits={digits} />} cursor={{ fill: "#F1F7F3" }} />
        <Bar dataKey="value" name="Promedio" radius={[0, 4, 4, 0]} isAnimationActive={false} label={{ position: "right", fontSize: 11, fill: C.ink2, formatter: (v) => num(v, digits) }}>
          {items.map((it) => (
            <Cell key={it.id} fill={it.id === highlightId ? highlight : color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ Dispersión */
export function CloudScatter({ points, highlightId }) {
  const normal = points.filter((p) => p.id !== highlightId);
  const hi = points.filter((p) => p.id === highlightId);
  const tip = ({ active, payload }) =>
    active && payload?.length ? (
      <div className="chart-tip">
        <strong>{payload[0].payload.label}</strong>
        Nubosidad: {num(payload[0].payload.x, 1)} %<br />
        Radiación: {num(payload[0].payload.y, 2)} HSP
      </div>
    ) : null;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 8, right: 12, bottom: 18, left: -12 }}>
        <CartesianGrid stroke={C.grid} />
        <XAxis type="number" dataKey="x" name="Nubosidad" unit=" %" tick={axis} tickLine={false} domain={["auto", "auto"]}
          label={{ value: "Nubosidad promedio (%)", position: "insideBottom", offset: -10, fontSize: 12, fill: C.ink2 }} />
        <YAxis type="number" dataKey="y" name="HSP" tick={axis} tickLine={false} axisLine={false} domain={["auto", "auto"]} tickFormatter={(v) => num(v, 1)} />
        <ZAxis range={[70, 70]} />
        <Tooltip content={tip} cursor={{ strokeDasharray: "3 3" }} />
        <Scatter data={normal} fill={C.leafBright} fillOpacity={0.65} isAnimationActive={false} />
        <Scatter data={hi} fill={C.sun} stroke={C.ink} strokeWidth={1.5} isAnimationActive={false} shape="circle" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------ Barras divergentes */
export function CorrelationBars({ items }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {items.map((it) => {
        const pos = it.value >= 0;
        return (
          <div key={it.label} aria-label={`${it.label}: ${num(it.value, 2)}`}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span>{it.label}</span>
              <b className="num">{num(it.value, 2)}</b>
            </div>
            <div style={{ position: "relative", height: 12, marginTop: 4 }}>
              <div style={{ position: "absolute", left: "50%", top: -3, bottom: -3, width: 1, background: C.neutral }} />
              <div
                style={{
                  position: "absolute", top: 0, bottom: 0,
                  [pos ? "left" : "right"]: "50%",
                  width: `${Math.abs(it.value) * 50}%`,
                  background: pos ? C.blue : C.red,
                  borderRadius: pos ? "0 4px 4px 0" : "4px 0 0 4px",
                }}
              />
            </div>
          </div>
        );
      })}
      <div className="small muted" style={{ display: "flex", justifyContent: "space-between" }}>
        <span>−1: más de esto, menos sol</span>
        <span>+1: más de esto, más sol</span>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- Columnas simples */
export function Columns({ data, unit = "", color = C.leaf, height = 240, digits = 0 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={{ stroke: C.grid }} />
        <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<Tip unit={unit} digits={digits} />} cursor={{ fill: "#F1F7F3" }} />
        <Bar dataKey="value" name={unit || "Valor"} fill={color} radius={[4, 4, 0, 0]} isAnimationActive={false}
          label={{ position: "top", fontSize: 11, fill: C.ink2, formatter: (v) => (v ? num(v, digits) : "") }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export { ReferenceLine };
