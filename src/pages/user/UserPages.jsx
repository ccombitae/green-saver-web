import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { auth as authApi, calculations, systems } from "../../api/endpoints";
import { useAuth } from "../../auth/AuthContext";
import { PageHead } from "../../components/AppShell";
import { EstimateResult, EstimatorForm } from "../../components/Estimator";
import { MiniRoof } from "../../components/Illustrations";
import { Empty, ErrorNote, Loading, Pager, useAsync, usePaged, useToast } from "../../components/ui";
import { date, num } from "../../utils/format";

// ------------------------------------------------------------------ Inicio
export function UserHome() {
  const { user } = useAuth();
  const calcs = useAsync(() => calculations.list(), []);
  const sys = useAsync(() => systems.mine(user.email), [user.email]);
  const last = calcs.data?.[0];
  const firstName = (user?.name || "").split(" ")[0];

  return (
    <>
      <PageHead title={firstName ? `Hola, ${firstName}` : "Hola"}>Este es el estado de tu proyecto solar.</PageHead>
      <section className="welcome">
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: "var(--step-1)" }}>Tu techo puede producir tu propia energía</h2>
          <p>Calcula tu sistema, guárdalo y el equipo de Green Saver te envía la cotización.</p>
          <Link className="btn btn-primary" to="/app/calcular" style={{ marginTop: 12 }}>
            Nuevo cálculo
          </Link>
        </div>
        <MiniRoof className="welcome-art" />
      </section>
      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2>Tu último cálculo</h2>
            <Link to="/app/historial" className="small">
              Ver historial
            </Link>
          </div>
          {calcs.loading ? (
            <Loading />
          ) : calcs.error ? (
            <ErrorNote error={calcs.error} onRetry={calcs.reload} />
          ) : last ? (
            <>
              <div className="figures">
                <div>
                  <div className="figure-value">{last.panels}</div>
                  <div className="figure-label">Paneles</div>
                </div>
                <div>
                  <div className="figure-value">{num(last.consumption, 0)}</div>
                  <div className="figure-label">kWh al mes</div>
                </div>
                <div>
                  <div className="figure-value">{num(last.coverage, 0)} %</div>
                  <div className="figure-label">Cobertura</div>
                </div>
              </div>
              <p className="small muted" style={{ marginTop: 16, marginBottom: 0 }}>
                Calculado el {date(last.createdAt)}.
              </p>
            </>
          ) : (
            <Empty title="Aún no has calculado tu sistema" action={<Link className="btn btn-primary" to="/app/calcular">Calcular ahora</Link>}>
              Toma un recibo de luz: solo necesitas tu consumo mensual en kWh.
            </Empty>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Tu sistema instalado</h2>
            <Link to="/app/mi-sistema" className="small">
              Ver detalle
            </Link>
          </div>
          {sys.loading ? (
            <Loading />
          ) : sys.error ? (
            <ErrorNote error={sys.error} onRetry={sys.reload} />
          ) : sys.data ? (
            <dl className="kv">
              <dt>Capacidad</dt>
              <dd>{sys.data.capacity || "—"}</dd>
              <dt>Paneles</dt>
              <dd>{sys.data.panels || "—"}</dd>
              <dt>Instalación</dt>
              <dd>{date(sys.data.installDate)}</dd>
            </dl>
          ) : (
            <p className="muted" style={{ margin: 0 }}>
              Todavía no tienes un sistema instalado. Cuando aceptes una cotización, verás aquí sus datos.
            </p>
          )}
        </section>
      </div>

      <section className="panel" style={{ marginTop: "var(--gap)" }}>
        <h2>¿Qué sigue?</h2>
        <ol className="list-plain">
          <li>
            <strong>Calcula tu sistema</strong> con tu consumo y tu ciudad. <Link to="/app/calcular">Ir a la calculadora</Link>
          </li>
          <li>
            <strong>Recibe una cotización</strong> en tu correo: nuestro equipo la prepara a partir de tu cálculo guardado.
          </li>
          <li>
            <strong>Instalación</strong>: al aceptar la cotización, tu sistema aparece en «Mi sistema».
          </li>
        </ol>
      </section>
    </>
  );
}

// -------------------------------------------------------------- Calculadora
export function Calculator() {
  const { user } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [result, setResult] = useState(null);
  const [input, setInput] = useState(null);
  const [saved, setSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const savedKwh = Math.min(result.generacion_mensual_promedio_kwh, input.consumption);
      const created = await calculations.create({
        email: user.email,
        consumption: input.consumption,
        panels: result.paneles,
        coverage: result.cobertura_anual_pct,
        savings: Math.round(savedKwh),
        recommendation: `${result.ciudad?.nombre ?? ""}: ${result.recomendacion}`,
      });
      setSaved(created.id);
      toast("Cálculo guardado en tu historial.");
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHead title="Calcular sistema">
        Ingresa tu consumo mensual y tu ciudad. El modelo estima la radiación de cada mes y dimensiona tu sistema.
      </PageHead>
      <section className="panel">
        <EstimatorForm
          submitLabel="Calcular sistema"
          initial={location.state}
          onResult={(r, i) => {
            setResult(r);
            setInput(i);
            setSaved(null);
          }}
        />
      </section>
      {result ? (
        <section className="panel">
          <EstimateResult result={result} consumption={input.consumption} />
          <ErrorNote error={error} />
          <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
            {saved ? (
              <Link className="btn btn-secondary" to={`/app/historial/${saved}`}>
                Ver en mi historial
              </Link>
            ) : (
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? "Guardando…" : "Guardar cálculo"}
              </button>
            )}
          </div>
          {saved ? <p className="small muted" style={{ marginTop: 10 }}>Con el cálculo guardado, nuestro equipo puede enviarte una cotización.</p> : null}
        </section>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------- Historial
export function History() {
  const navigate = useNavigate();
  const { data, error, loading, reload } = useAsync(() => calculations.list(), []);
  const paged = usePaged(data, 10);

  return (
    <>
      <PageHead title="Historial de cálculos" actions={<Link className="btn btn-primary" to="/app/calcular">Nuevo cálculo</Link>}>
        Todos los cálculos que has guardado, del más reciente al más antiguo.
      </PageHead>
      <section className="panel">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorNote error={error} onRetry={reload} />
        ) : !data.length ? (
          <Empty title="Todavía no hay cálculos guardados" action={<Link className="btn btn-primary" to="/app/calcular">Calcular mi sistema</Link>} />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th className="right">Consumo (kWh/mes)</th>
                    <th className="right">Paneles</th>
                    <th className="right">Cobertura</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paged.slice.map((c) => (
                    <tr key={c.id}>
                      <td>{date(c.createdAt)}</td>
                      <td className="right num">{num(c.consumption, 0)}</td>
                      <td className="right num">{c.panels}</td>
                      <td className="right num">{num(c.coverage, 0)} %</td>
                      <td className="right">
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/app/historial/${c.id}`)}>
                          Ver detalle
                        </button>
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
    </>
  );
}

export function HistoryDetail() {
  const { id } = useParams();
  const { data, error, loading, reload } = useAsync(() => calculations.list(), []);
  const calc = data?.find((c) => String(c.id) === String(id));

  return (
    <>
      <PageHead title="Detalle del cálculo" actions={<Link className="btn btn-secondary" to="/app/historial">Volver al historial</Link>} />
      <section className="panel">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorNote error={error} onRetry={reload} />
        ) : !calc ? (
          <Empty title="No encontramos ese cálculo" action={<Link className="btn btn-primary" to="/app/historial">Ir al historial</Link>} />
        ) : (
          <>
            <dl className="kv">
              <dt>Fecha</dt>
              <dd>{date(calc.createdAt)}</dd>
              <dt>Consumo mensual</dt>
              <dd className="num">{num(calc.consumption, 0)} kWh</dd>
              <dt>Paneles recomendados</dt>
              <dd className="num">{calc.panels}</dd>
              <dt>Cobertura anual</dt>
              <dd className="num">{num(calc.coverage, 1)} %</dd>
              <dt>Energía ahorrada</dt>
              <dd className="num">{num(calc.savings, 0)} kWh al mes</dd>
            </dl>
            <p style={{ marginTop: 20 }}>{calc.recommendation}</p>
            <Link className="btn btn-primary" to="/app/calcular" state={{ consumption: calc.consumption }}>
              Recalcular con este consumo
            </Link>
          </>
        )}
      </section>
    </>
  );
}

// --------------------------------------------------------------- Mi sistema
export function MySystem() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsync(() => systems.mine(user.email), [user.email]);
  return (
    <>
      <PageHead title="Mi sistema">Los datos del sistema solar instalado en tu vivienda.</PageHead>
      <section className="panel">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorNote error={error} onRetry={reload} />
        ) : !data ? (
          <Empty title="Aún no tienes un sistema instalado" action={<Link className="btn btn-primary" to="/app/calcular">Calcular mi sistema</Link>}>
            Cuando aceptes una cotización y se programe la instalación, verás aquí la capacidad, los equipos y la fecha.
          </Empty>
        ) : (
          <dl className="kv">
            <dt>Capacidad</dt>
            <dd>{data.capacity || "—"}</dd>
            <dt>Paneles</dt>
            <dd>{data.panels || "—"}</dd>
            <dt>Inversor</dt>
            <dd>{data.inverter || "—"}</dd>
            <dt>Batería</dt>
            <dd>{data.battery || "—"}</dd>
            <dt>Fecha de instalación</dt>
            <dd>{date(data.installDate)}</dd>
            <dt>Última actualización</dt>
            <dd>{date(data.updatedAt)}</dd>
          </dl>
        )}
      </section>
    </>
  );
}

// ----------------------------------------------------------- Energía solar
export function Learn() {
  return (
    <>
      <PageHead title="Energía solar en tu casa">Lo básico para entender tu cálculo y decidir con información.</PageHead>
      <div className="grid-2">
        <section className="panel">
          <h2>¿Qué son las horas solares pico?</h2>
          <p>
            Es la energía del sol que llega a un metro cuadrado en un día, expresada como las horas que el sol tendría que
            brillar a máxima intensidad (1.000 W/m²). Si tu ciudad tiene 4,7 horas solares pico, un panel de 550 W produce
            cerca de 0,55 × 4,7 ≈ 2,6 kWh al día antes de pérdidas.
          </p>
          <p className="muted" style={{ marginBottom: 0 }}>
            En Colombia van de unas 3,8 en el Pacífico y el piedemonte amazónico a más de 5,5 en el Caribe.
          </p>
        </section>
        <section className="panel">
          <h2>¿Cómo se calcula mi sistema?</h2>
          <p>
            Energía de un panel en el mes = potencia × horas solares pico × días × rendimiento del sistema (0,80, por
            pérdidas de calor, cables e inversor). El número de paneles es tu consumo dividido entre esa energía,
            redondeado hacia arriba.
          </p>
          <p className="muted" style={{ marginBottom: 0 }}>
            Por eso la misma casa necesita menos paneles en Riohacha que en Quibdó.
          </p>
        </section>
        <section className="panel">
          <h2>Beneficios</h2>
          <ul>
            <li>Reduces tu factura de energía desde el primer mes.</li>
            <li>Disminuyes las emisiones de CO₂ de tu hogar.</li>
            <li>La Ley 1715 de 2014 ofrece incentivos tributarios para estos proyectos.</li>
            <li>Con la Resolución CREG 174 de 2021 puedes entregar a la red la energía que te sobre.</li>
          </ul>
        </section>
        <section className="panel">
          <h2>Consejos antes de instalar</h2>
          <ul>
            <li>Ten a mano los recibos de luz de los últimos 6 a 12 meses y usa el promedio.</li>
            <li>Revisa que el techo reciba sol directo la mayor parte del día, sin sombras de árboles o edificios.</li>
            <li>Limpia los paneles cada pocos meses: el polvo reduce la producción.</li>
            <li>Pide siempre una visita técnica para confirmar el diseño final.</li>
          </ul>
        </section>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ Perfil
export function Profile() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useAsync(() => authApi.me(), []);
  return (
    <>
      <PageHead title="Perfil">Tus datos de cuenta.</PageHead>
      <section className="panel" style={{ maxWidth: 640 }}>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorNote error={error} onRetry={reload} />
        ) : (
          <dl className="kv">
            <dt>Nombre</dt>
            <dd>{data.name}</dd>
            <dt>Correo</dt>
            <dd>{data.email}</dd>
            <dt>Teléfono</dt>
            <dd>{data.phone || "—"}</dd>
            <dt>Rol</dt>
            <dd>{data.role === "admin" ? "Administrador" : "Usuario"}</dd>
          </dl>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
          <Link className="btn btn-secondary" to="/recuperar">
            Cambiar contraseña
          </Link>
          <button
            className="btn btn-danger"
            onClick={() => {
              logout();
              navigate("/ingresar");
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </section>
    </>
  );
}
