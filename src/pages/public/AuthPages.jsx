import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { auth as authApi } from "../../api/endpoints";
import { useAuth } from "../../auth/AuthContext";
import { homeFor } from "../../auth/guards";
import { Brand } from "../../components/Brand";
import { Field, useToast } from "../../components/ui";
import { passwordProblem, validEmail } from "../../utils/format";

function AuthLayout({ title, children, aside }) {
  return (
    <div className="auth-wrap">
      <div className="auth-side">
        <Brand />
        <h2>{aside}</h2>
        <p className="small" style={{ color: "#9fc6b1", margin: 0 }}>
          Universidad de Cundinamarca · Seccional Girardot
        </p>
      </div>
      <main className="auth-main">
        <div className="auth-form">
          <h1 style={{ fontSize: "var(--step-3)" }}>{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}

export function Login() {
  const { login, user, expired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!validEmail(form.email)) errs.email = "Escribe un correo válido, por ejemplo nombre@correo.com.";
    if (!form.password) errs.password = "Escribe tu contraseña.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setError(null);
    try {
      const u = await login(form.email, form.password);
      const from = location.state?.from;
      navigate(from && from.startsWith(u.role === "admin" ? "/admin" : "/app") ? from : homeFor(u), { replace: true });
    } catch (err) {
      setError(err.status === 401 ? "El correo o la contraseña no coinciden." : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Ingresar" aside="Tu sistema solar, calculado con el clima real de tu ciudad.">
      {expired ? <div className="alert alert-warn">Tu sesión expiró. Ingresa de nuevo.</div> : null}
      {error ? (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      ) : null}
      <form onSubmit={submit} noValidate>
        <Field label="Correo" error={errors.email}>
          {(id) => (
            <input id={id} className="input" type="email" autoComplete="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} aria-invalid={Boolean(errors.email)} />
          )}
        </Field>
        <Field label="Contraseña" error={errors.password}>
          {(id) => (
            <input id={id} className="input" type="password" autoComplete="current-password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} aria-invalid={Boolean(errors.password)} />
          )}
        </Field>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
      <p className="small" style={{ marginTop: 20 }}>
        <Link to="/recuperar">Olvidé mi contraseña</Link>
        <br />
        ¿No tienes cuenta? <Link to="/registro">Crea una</Link> · <Link to="/">Volver al inicio</Link>
      </p>
    </AuthLayout>
  );
}

export function Register() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user)} replace />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 3) errs.name = "Escribe tu nombre completo.";
    if (!/^[+\d\s-]{7,15}$/.test(form.phone.trim())) errs.phone = "Escribe un teléfono válido, solo números.";
    if (!validEmail(form.email)) errs.email = "Escribe un correo válido.";
    const pw = passwordProblem(form.password);
    if (pw) errs.password = pw;
    if (form.confirm !== form.password) errs.confirm = "Las contraseñas no coinciden.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setError(null);
    try {
      await register({ name: form.name.trim(), phone: form.phone.trim(), email: form.email, password: form.password });
      navigate("/app", { replace: true });
    } catch (err) {
      setError(err.message === "El usuario ya existe" ? "Ya existe una cuenta con ese correo. Ingresa o recupera tu contraseña." : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Crear cuenta" aside="Guarda tus cálculos y recibe una cotización de tu sistema.">
      {error ? (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      ) : null}
      <form onSubmit={submit} noValidate>
        <Field label="Nombre completo" error={errors.name}>
          {(id) => <input id={id} className="input" autoComplete="name" value={form.name} onChange={set("name")} aria-invalid={Boolean(errors.name)} />}
        </Field>
        <Field label="Teléfono" error={errors.phone}>
          {(id) => <input id={id} className="input" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} aria-invalid={Boolean(errors.phone)} />}
        </Field>
        <Field label="Correo" error={errors.email}>
          {(id) => <input id={id} className="input" type="email" autoComplete="email" value={form.email} onChange={set("email")} aria-invalid={Boolean(errors.email)} />}
        </Field>
        <Field label="Contraseña" error={errors.password} hint="Mínimo 8 caracteres, con letras y números.">
          {(id) => <input id={id} className="input" type="password" autoComplete="new-password" value={form.password} onChange={set("password")} aria-invalid={Boolean(errors.password)} />}
        </Field>
        <Field label="Confirmar contraseña" error={errors.confirm}>
          {(id) => <input id={id} className="input" type="password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} aria-invalid={Boolean(errors.confirm)} />}
        </Field>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>
      <p className="small" style={{ marginTop: 20 }}>
        ¿Ya tienes cuenta? <Link to="/ingresar">Ingresa</Link>
      </p>
    </AuthLayout>
  );
}

export function Recover() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!validEmail(form.email)) errs.email = "Escribe el correo con el que te registraste.";
    const pw = passwordProblem(form.password);
    if (pw) errs.password = pw;
    if (form.confirm !== form.password) errs.confirm = "Las contraseñas no coinciden.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setError(null);
    try {
      await authApi.recover(form.email.trim().toLowerCase(), form.password);
      toast("Contraseña actualizada. Ya puedes ingresar.");
      navigate("/ingresar");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Recuperar contraseña" aside="Define una contraseña nueva para tu cuenta.">
      {error ? (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      ) : null}
      <form onSubmit={submit} noValidate>
        <Field label="Correo" error={errors.email}>
          {(id) => <input id={id} className="input" type="email" value={form.email} onChange={set("email")} aria-invalid={Boolean(errors.email)} />}
        </Field>
        <Field label="Contraseña nueva" error={errors.password} hint="Mínimo 8 caracteres, con letras y números.">
          {(id) => <input id={id} className="input" type="password" autoComplete="new-password" value={form.password} onChange={set("password")} aria-invalid={Boolean(errors.password)} />}
        </Field>
        <Field label="Confirmar contraseña" error={errors.confirm}>
          {(id) => <input id={id} className="input" type="password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} aria-invalid={Boolean(errors.confirm)} />}
        </Field>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "Guardando…" : "Guardar contraseña nueva"}
        </button>
      </form>
      <p className="small" style={{ marginTop: 20 }}>
        <Link to="/ingresar">Volver a ingresar</Link>
      </p>
    </AuthLayout>
  );
}

export function NotFound() {
  const { user } = useAuth();
  return (
    <main className="content" style={{ margin: "10vh auto", textAlign: "center" }}>
      <h1>Esta página no existe</h1>
      <p className="muted" style={{ margin: "0 auto 20px" }}>
        Revisa la dirección o vuelve a un lugar conocido.
      </p>
      <Link className="btn btn-primary" to={user ? homeFor(user) : "/"}>
        {user ? "Ir a mi panel" : "Ir al inicio"}
      </Link>
    </main>
  );
}
