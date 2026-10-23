import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { calculations, quotes, systems, users } from "../../api/endpoints";
import { useAuth } from "../../auth/AuthContext";
import { PageHead } from "../../components/AppShell";
import { Columns } from "../../components/charts";
import { ConfirmDialog, Empty, ErrorNote, Field, Loading, Modal, Pager, StatusBadge, useAsync, usePaged, useToast } from "../../components/ui";
import { cop, date, num, QUOTE_STATUS } from "../../utils/format";

const loadAll = () => Promise.all([users.list(), calculations.list(), quotes.list()]);

// ------------------------------------------------------------------ Resumen
export function AdminHome() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsync(loadAll, []);

  const summary = useMemo(() => {
    if (!data) return null;
    const [us, cs, qs] = data;
    const quoted = new Set(qs.map((q) => q.calculationId));
    return {
      users: us.filter((u) => u.role !== "admin").length,
      calcs: cs.length,
      pending: cs.filter((c) => !quoted.has(c.id)),
      accepted: qs.filter((q) => q.status === "accepted").length,
      sent: qs.length,
    };
  }, [data]);

  return (
    <>
      <PageHead title="Resumen">Sesión de {user?.email}. Lo que requiere atención hoy.</PageHead>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote error={error} onRetry={reload} />
      ) : (
        <>
          <section className="panel">
            <div className="figures">
              <div>
                <div className="figure-value">{summary.users}</div>
                <div className="figure-label">Clientes registrados</div>
              </div>
              <div>
                <div className="figure-value">{summary.calcs}</div>
                <div className="figure-label">Cálculos guardados</div>
              </div>
              <div>
                <div className="figure-value">{summary.pending.length}</div>
                <div className="figure-label">Cálculos sin cotizar</div>
              </div>
              <div>
                <div className="figure-value">
                  {summary.accepted}/{summary.sent}
                </div>
                <div className="figure-label">Cotizaciones aceptadas</div>
              </div>
            </div>
          </section>
          <section className="panel">
            <div className="panel-head">
              <h2>Cálculos esperando cotización</h2>
              <Link className="small" to="/admin/cotizaciones">
                Ir a cotizaciones
              </Link>
            </div>
            {summary.pending.length ? (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Fecha</th>
                      <th className="right">Consumo</th>
                      <th className="right">Paneles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.pending.slice(0, 6).map((c) => (
                      <tr key={c.id}>
                        <td>{c.email}</td>
                        <td>{date(c.createdAt)}</td>
                        <td className="right num">{num(c.consumption, 0)} kWh</td>
                        <td className="right num">{c.panels}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                Todos los cálculos ya tienen cotización.
              </p>
            )}
          </section>
        </>
      )}
    </>
  );
}

// ----------------------------------------------------------------- Usuarios
function AssignSystemModal({ target, onClose, onDone }) {
  const toast = useToast();
  const [form, setForm] = useState({ capacity: "", panels: "", inverter: "", battery: "", installDate: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!(Number(form.capacity) > 0)) errs.capacity = "Escribe la capacidad en kWp, mayor que cero.";
    if (!(Number.isInteger(Number(form.panels)) && Number(form.panels) > 0)) errs.panels = "Escribe un número entero de paneles.";
    if (!form.inverter.trim()) errs.inverter = "Indica el modelo del inversor.";
    if (!form.installDate) errs.installDate = "Elige la fecha de instalación.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setError(null);
    try {
      await systems.assign(target.email, {
        capacity: `${Number(form.capacity)} kWp`,
        panels: `${Number(form.panels)} paneles`,
        inverter: form.inverter.trim(),
        battery: form.battery.trim() || "Sin batería",
        installDate: form.installDate,
      });
      toast(`Sistema asignado a ${target.name || target.email}.`);
      onDone();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Asignar sistema a ${target.name || target.email}`} onClose={onClose}>
      <ErrorNote error={error} />
      <form onSubmit={submit} noValidate>
        <div className="form-row">
          <Field label="Capacidad (kWp)" error={errors.capacity}>
            {(id) => <input id={id} className="input num" inputMode="decimal" value={form.capacity} onChange={set("capacity")} aria-invalid={Boolean(errors.capacity)} />}
          </Field>
          <Field label="Número de paneles" error={errors.panels}>
            {(id) => <input id={id} className="input num" inputMode="numeric" value={form.panels} onChange={set("panels")} aria-invalid={Boolean(errors.panels)} />}
          </Field>
        </div>
        <Field label="Inversor" error={errors.inverter}>
          {(id) => <input id={id} className="input" placeholder="Ej. Inversor híbrido 5 kW" value={form.inverter} onChange={set("inverter")} aria-invalid={Boolean(errors.inverter)} />}
        </Field>
        <Field label="Batería" hint="Déjalo vacío si el sistema no tiene batería.">
          {(id) => <input id={id} className="input" value={form.battery} onChange={set("battery")} />}
        </Field>
        <Field label="Fecha de instalación" error={errors.installDate}>
          {(id) => <input id={id} className="input" type="date" value={form.installDate} onChange={set("installDate")} aria-invalid={Boolean(errors.installDate)} />}
        </Field>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Asignando…" : "Asignar sistema"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function Users() {
  const toast = useToast();
  const { data, error, loading, reload } = useAsync(() => users.list(), []);
  const [query, setQuery] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [toAssign, setToAssign] = useState(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data || []).filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [data, query]);
  const paged = usePaged(filtered, 8);

  const remove = async () => {
    setBusy(true);
    try {
      await users.remove(toDelete.id);
      toast(`Cuenta de ${toDelete.email} eliminada.`);
      setToDelete(null);
      reload();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHead title="Usuarios">Cuentas registradas. Desde aquí puedes asignar un sistema instalado o eliminar una cuenta.</PageHead>
      <section className="panel">
        <div className="panel-head">
          <div className="field" style={{ margin: 0, minWidth: 260 }}>
            <label htmlFor="buscar-usuario" className="sr-only">
              Buscar usuario
            </label>
            <input id="buscar-usuario" className="input" placeholder="Buscar por nombre o correo" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <span className="small muted num">{filtered.length} cuentas</span>
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorNote error={error} onRetry={reload} />
        ) : !filtered.length ? (
          <Empty title={query ? "Ninguna cuenta coincide con la búsqueda" : "Todavía no hay usuarios registrados"} />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Teléfono</th>
                    <th>Rol</th>
                    <th>Registro</th>
                    <th className="right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.slice.map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.phone || "—"}</td>
                      <td>
                        <span className={`badge ${u.role === "admin" ? "badge-warn" : "badge-neutral"}`}>{u.role === "admin" ? "Administrador" : "Usuario"}</span>
                      </td>
                      <td>{date(u.createdAt)}</td>
                      <td className="right" style={{ whiteSpace: "nowrap" }}>
                        {u.role === "admin" ? (
                          <span className="small muted">Cuenta del sistema</span>
                        ) : (
                          <>
                            <button className="btn btn-secondary btn-sm" onClick={() => setToAssign(u)}>
                              Asignar sistema
                            </button>{" "}
                            <button className="btn btn-danger btn-sm" onClick={() => setToDelete(u)}>
                              Eliminar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager {...paged} />
          </>
        )}
      </section>
      {toDelete ? (
        <ConfirmDialog
          title="Eliminar cuenta"
          message={`Se eliminará la cuenta de ${toDelete.email} y su sistema instalado. Sus cálculos se conservan para las estadísticas. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar cuenta"
          danger
          busy={busy}
          onConfirm={remove}
          onCancel={() => setToDelete(null)}
        />
      ) : null}
      {toAssign ? <AssignSystemModal target={toAssign} onClose={() => setToAssign(null)} onDone={() => setToAssign(null)} /> : null}
    </>
  );
}

// ------------------------------------------------------------ Cotizaciones
function AcceptModal({ quote, onClose, onDone }) {
  const toast = useToast();
  const [day, setDay] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!day) return setError(new Error("Elige la fecha de instalación."));
    setBusy(true);
    try {
      await quotes.accept(quote.id, day);
      toast("Cotización aceptada. El sistema quedó registrado en la cuenta del cliente.");
      onDone();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Aceptar cotización" onClose={onClose}>
      <p className="muted">
        {quote.clientName} · {quote.clientEmail} · {cop(quote.totalPrice)}
      </p>
      <ErrorNote error={error} />
      <form onSubmit={submit} noValidate>
        <Field label="Fecha de instalación">{(id) => <input id={id} className="input" type="date" value={day} onChange={(e) => setDay(e.target.value)} />}</Field>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Aceptando…" : "Aceptar cotización"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function Quotes() {
  const toast = useToast();
  const data = useAsync(() => Promise.all([quotes.calculations(), quotes.options(), quotes.list()]), []);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ panelType: "", inverterType: "", batteryType: "", structureType: "", price: "", notes: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");
  const [accepting, setAccepting] = useState(null);

  const [calcs, options, sent] = data.data || [[], {}, []];
  const calcPage = usePaged(calcs, 6);
  const visibleSent = sent.filter((q) => filter === "all" || q.status === filter);
  const sentPage = usePaged(visibleSent, 6);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const send = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!selected) errs.calc = "Elige el cálculo del cliente que vas a cotizar.";
    ["panelType", "inverterType", "batteryType", "structureType"].forEach((k) => !form[k] && (errs[k] = "Elige una opción."));
    if (!(Number(form.price) > 0)) errs.price = "Escribe el precio total en pesos, mayor que cero.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const res = await quotes.send({
        calculationId: selected.id,
        clientEmail: selected.email,
        clientName: selected.clientName || selected.email,
        totalPrice: Number(form.price),
        notes: form.notes.trim(),
        materials: { panelType: form.panelType, inverterType: form.inverterType, batteryType: form.batteryType, structureType: form.structureType },
      });
      toast(res.data?.status === "sent" ? `Cotización enviada a ${selected.email}.` : "Cotización guardada. El correo no se pudo enviar; revisa la configuración SMTP.", res.data?.status === "sent" ? "ok" : "error");
      setSelected(null);
      setForm({ panelType: "", inverterType: "", batteryType: "", structureType: "", price: "", notes: "" });
      data.reload();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const optionField = (key, label, list) => (
    <Field label={label} error={errors[key]}>
      {(id) => (
        <select id={id} className="input" value={form[key]} onChange={set(key)} aria-invalid={Boolean(errors[key])}>
          <option value="">Elige…</option>
          {(list || []).map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      )}
    </Field>
  );

  return (
    <>
      <PageHead title="Cotizaciones">Prepara la propuesta a partir del cálculo del cliente, envíala por correo y registra la aceptación.</PageHead>
      {data.loading ? (
        <Loading />
      ) : data.error ? (
        <ErrorNote error={data.error} onRetry={data.reload} />
      ) : (
        <>
          <div className="grid-2">
            <section className="panel">
              <h2>1. Elige el cálculo</h2>
              {errors.calc ? <div className="field-error" role="alert">{errors.calc}</div> : null}
              {!calcs.length ? (
                <Empty title="No hay cálculos guardados">Cuando un cliente guarde su cálculo aparecerá aquí.</Empty>
              ) : (
                <>
                  <ul className="list-plain" aria-label="Cálculos de clientes">
                    {calcPage.slice.map((c) => (
                      <li key={c.id}>
                        <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}>
                          <input type="radio" name="calculo" checked={selected?.id === c.id} onChange={() => setSelected(c)} style={{ marginTop: 5 }} />
                          <span>
                            <strong>{c.clientName}</strong>
                            <span className="small muted" style={{ display: "block" }}>
                              {c.email} · {date(c.createdAt)} · {num(c.consumption, 0)} kWh · {c.panels} paneles · {num(c.coverage, 0)} %
                            </span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <Pager {...calcPage} />
                </>
              )}
            </section>
            <section className="panel">
              <h2>2. Arma la propuesta</h2>
              <form onSubmit={send} noValidate>
                <div className="form-row">
                  {optionField("panelType", "Panel", options.panelTypes)}
                  {optionField("inverterType", "Inversor", options.inverterTypes)}
                </div>
                <div className="form-row">
                  {optionField("batteryType", "Batería", options.batteryTypes)}
                  {optionField("structureType", "Estructura", options.structureTypes)}
                </div>
                <Field label="Precio total (COP)" error={errors.price}>
                  {(id) => <input id={id} className="input num" inputMode="numeric" placeholder="Ej. 12500000" value={form.price} onChange={set("price")} aria-invalid={Boolean(errors.price)} />}
                </Field>
                <Field label="Notas técnicas" hint="Opcional. Se incluyen en el correo al cliente.">
                  {(id) => <textarea id={id} className="input" rows="3" value={form.notes} onChange={set("notes")} />}
                </Field>
                <button className="btn btn-primary" disabled={busy}>
                  {busy ? "Enviando…" : selected ? `Enviar cotización a ${selected.email}` : "Enviar cotización"}
                </button>
              </form>
            </section>
          </div>

          <section className="panel" style={{ marginTop: "var(--gap)" }}>
            <div className="panel-head">
              <h2>Cotizaciones enviadas</h2>
              <div className="seg" role="group" aria-label="Filtrar por estado">
                {[["all", "Todas"], ...Object.entries(QUOTE_STATUS).filter(([k]) => k !== "pending").map(([k, v]) => [k, v.label])].map(([k, label]) => (
                  <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {!visibleSent.length ? (
              <Empty title="No hay cotizaciones con este estado" />
            ) : (
              <>
                <div className="table-wrap">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Enviada</th>
                        <th>Materiales</th>
                        <th className="right">Precio</th>
                        <th>Estado</th>
                        <th className="right"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sentPage.slice.map((q) => (
                        <tr key={q.id}>
                          <td>
                            {q.clientName}
                            <span className="small muted" style={{ display: "block" }}>{q.clientEmail}</span>
                          </td>
                          <td>{date(q.sentAt)}</td>
                          <td className="small">{[q.materials.panelType, q.materials.inverterType, q.materials.batteryType].filter(Boolean).join(", ")}</td>
                          <td className="right num">{cop(q.totalPrice)}</td>
                          <td>
                            <StatusBadge status={q.status} />
                            {q.installDate ? <span className="small muted" style={{ display: "block" }}>Instalación {date(q.installDate)}</span> : null}
                          </td>
                          <td className="right">
                            {q.status !== "accepted" ? (
                              <button className="btn btn-secondary btn-sm" onClick={() => setAccepting(q)}>
                                Aceptar
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pager {...sentPage} />
              </>
            )}
          </section>
        </>
      )}
      {accepting ? (
        <AcceptModal
          quote={accepting}
          onClose={() => setAccepting(null)}
          onDone={() => {
            setAccepting(null);
            data.reload();
          }}
        />
      ) : null}
    </>
  );
}

// ------------------------------------------------------------ Estadísticas
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function Statistics() {
  const { data, error, loading, reload } = useAsync(loadAll, []);
  const stats = useMemo(() => {
    if (!data) return null;
    const [us, cs, qs] = data;
    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const now = new Date();
    const lastSix = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 5 + i, 1));
    const perMonth = lastSix.map((d) => ({
      label: `${MONTHS[d.getMonth()]}`,
      value: cs.filter((c) => {
        const cd = new Date(c.createdAt);
        return cd.getFullYear() === d.getFullYear() && cd.getMonth() === d.getMonth();
      }).length,
    }));
    const byStatus = ["sent", "failed", "accepted"].map((s) => ({ label: QUOTE_STATUS[s].label, value: qs.filter((q) => q.status === s).length }));
    const buckets = [
      ["< 150", 0, 150],
      ["150–300", 150, 300],
      ["300–500", 300, 500],
      ["500–800", 500, 800],
      ["≥ 800", 800, Infinity],
    ].map(([label, lo, hi]) => ({ label, value: cs.filter((c) => c.consumption >= lo && c.consumption < hi).length }));
    const accepted = qs.filter((q) => q.status === "accepted");
    return {
      users: us.filter((u) => u.role !== "admin").length,
      calcs: cs.length,
      avgConsumption: avg(cs.map((c) => c.consumption)),
      avgPanels: avg(cs.map((c) => c.panels)),
      avgCoverage: avg(cs.map((c) => c.coverage)),
      quotes: qs.length,
      conversion: qs.length ? (accepted.length / qs.length) * 100 : 0,
      soldValue: accepted.reduce((a, q) => a + q.totalPrice, 0),
      perMonth,
      byStatus,
      buckets,
    };
  }, [data]);

  return (
    <>
      <PageHead title="Estadísticas">Indicadores del uso de la plataforma y del proceso comercial.</PageHead>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote error={error} onRetry={reload} />
      ) : (
        <>
          <section className="panel">
            <div className="figures">
              <div><div className="figure-value">{stats.users}</div><div className="figure-label">Clientes</div></div>
              <div><div className="figure-value">{stats.calcs}</div><div className="figure-label">Cálculos</div></div>
              <div><div className="figure-value">{num(stats.avgConsumption, 0)}</div><div className="figure-label">kWh/mes promedio</div></div>
              <div><div className="figure-value">{num(stats.avgPanels, 1)}</div><div className="figure-label">Paneles por cálculo</div></div>
              <div><div className="figure-value">{num(stats.avgCoverage, 0)} %</div><div className="figure-label">Cobertura promedio</div></div>
              <div><div className="figure-value">{num(stats.conversion, 0)} %</div><div className="figure-label">Cotizaciones aceptadas</div></div>
              <div><div className="figure-value">{cop(stats.soldValue)}</div><div className="figure-label">Valor aceptado</div></div>
            </div>
          </section>
          <div className="grid-3" style={{ marginTop: "var(--gap)" }}>
            <section className="panel">
              <h3>Cálculos por mes</h3>
              <p className="small muted">Últimos seis meses.</p>
              <Columns data={stats.perMonth} unit="cálculos" />
            </section>
            <section className="panel">
              <h3>Consumo de los clientes</h3>
              <p className="small muted">Cálculos por rango de kWh al mes.</p>
              <Columns data={stats.buckets} unit="cálculos" color="#00A859" />
            </section>
            <section className="panel">
              <h3>Estado de las cotizaciones</h3>
              <p className="small muted">{stats.quotes} cotizaciones en total.</p>
              <Columns data={stats.byStatus} unit="cotizaciones" color="#4A5B52" />
            </section>
          </div>
        </>
      )}
    </>
  );
}
