import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { homeFor } from "../../auth/guards";
import { Brand } from "../../components/Brand";
import { EstimateResult, EstimatorForm } from "../../components/Estimator";
import { SolarHouseScene, StepIcon } from "../../components/Illustrations";

export default function Landing() {
  const { user } = useAuth();
  const [result, setResult] = useState(null);
  const [consumption, setConsumption] = useState(0);

  return (
    <>
      <header className="public-top">
        <Brand />
        <nav aria-label="Cuenta">
          {user ? (
            <Link className="btn btn-primary" to={homeFor(user)}>
              Ir a mi panel
            </Link>
          ) : (
            <>
              <Link className="btn btn-ghost" to="/ingresar">
                Ingresar
              </Link>
              <Link className="btn btn-primary" to="/registro">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="hero">
          <div>
            <h1>¿Cuántos paneles solares necesita tu casa?</h1>
            <p className="lede">
              Escribe lo que consumes al mes y elige tu ciudad. Calculamos tu sistema con veinte años de datos climáticos
              de la NASA, mes a mes.
            </p>
            <div className="hero-facts">
              <div>
                <strong>49</strong>
                ciudades de Colombia con datos de radiación
              </div>
              <div>
                <strong>5 %</strong>
                de error promedio del modelo en zonas que no conocía
              </div>
            </div>
            <SolarHouseScene className="hero-art" />
          </div>

          <div className="calc-card">
            <h2 style={{ fontSize: "var(--step-1)" }}>Calcula tu sistema</h2>
            <EstimatorForm
              compact
              onResult={(r, input) => {
                setResult(r);
                setConsumption(input.consumption);
              }}
            />
            {result ? (
              <>
                <EstimateResult result={result} consumption={consumption} />
                <div className="alert alert-ok" style={{ marginTop: 16, marginBottom: 0 }}>
                  {user ? (
                    <>
                      Guarda este cálculo y pide una cotización desde <Link to="/app/calcular">tu calculadora</Link>.
                    </>
                  ) : (
                    <>
                      <Link to="/registro">Crea una cuenta</Link> para guardar tus cálculos y recibir una cotización.
                    </>
                  )}
                </div>
              </>
            ) : (
              <p className="small muted" style={{ marginTop: 16, marginBottom: 0 }}>
                Sin registro. El resultado muestra paneles, potencia, ahorro y la producción de cada mes.
              </p>
            )}
          </div>
        </section>

        <section className="how" aria-labelledby="como">
          <h2 id="como">Cómo calculamos</h2>
          <ol className="steps">
            <li>
              <StepIcon kind="bill" />
              <h3>Tu consumo</h3>
              <p className="muted">Partimos de los kWh que tu hogar usa al mes, el dato de tu recibo de luz.</p>
            </li>
            <li>
              <StepIcon kind="sun" />
              <h3>El sol de tu ciudad</h3>
              <p className="muted">
                Un modelo de aprendizaje automático estima las horas solares pico de cada mes a partir de la nubosidad,
                la temperatura y la ubicación.
              </p>
            </li>
            <li>
              <StepIcon kind="panel" />
              <h3>Tu sistema</h3>
              <p className="muted">
                Con esa radiación calculamos cuántos paneles necesitas, cuánto producen en cada mes y cuánto ahorrarías.
              </p>
            </li>
          </ol>
        </section>
      </main>
      <footer className="public-foot">
        Green Saver · Universidad de Cundinamarca, Seccional Girardot · Datos climáticos: NASA POWER
      </footer>
    </>
  );
}
