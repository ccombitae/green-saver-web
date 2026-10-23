import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { QUOTE_STATUS } from "../utils/format";

export function Field({ label, hint, error, children, id }) {
  const auto = useId();
  const fieldId = id || auto;
  const child = typeof children === "function" ? children(fieldId) : children;
  return (
    <div className="field">
      <label htmlFor={fieldId}>{label}</label>
      {child}
      {error ? (
        <span className="field-error" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="hint">{hint}</span>
      ) : null}
    </div>
  );
}

export function Loading({ text = "Cargando…" }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden="true" />
      {text}
    </div>
  );
}

export function ErrorNote({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="alert alert-error" role="alert">
      {error.message || String(error)}{" "}
      {onRetry ? (
        <button className="btn btn-ghost btn-sm" onClick={onRetry}>
          Reintentar
        </button>
      ) : null}
    </div>
  );
}

export function Empty({ title, children, action }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children ? <p style={{ margin: "0 auto 16px" }}>{children}</p> : null}
      {action}
    </div>
  );
}

export function StatusBadge({ status }) {
  const s = QUOTE_STATUS[status] || { label: status || "—", tone: "neutral" };
  return <span className={`badge badge-${s.tone}`}>{s.label}</span>;
}

export function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.querySelector("input, select, textarea, button")?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel, danger, busy, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p>{message}</p>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
        <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm} disabled={busy}>
          {busy ? "Procesando…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

// --------------------------------------------------------------- avisos
const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((text, tone = "ok") => {
    const id = Math.random().toString(36).slice(2);
    setItems((list) => [...list, { id, text, tone }]);
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 4500);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.tone === "error" ? "toast-error" : ""}`}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

// --------------------------------------------------------------- datos
/** Carga datos asíncronos con estados de carga y error, y permite recargar. */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fn();
      setState({ data, error: null, loading: false });
    } catch (error) {
      setState({ data: null, error, loading: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    run();
  }, [run]);
  return { ...state, reload: run };
}

export function usePaged(items, size = 8) {
  const [page, setPage] = useState(1);
  const total = Math.max(1, Math.ceil((items?.length || 0) / size));
  const current = Math.min(page, total);
  const slice = (items || []).slice((current - 1) * size, current * size);
  return { slice, page: current, total, setPage };
}

export function Pager({ page, total, setPage }) {
  if (total <= 1) return null;
  return (
    <div className="pager">
      <button className="btn btn-secondary btn-sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>
        Anterior
      </button>
      <span className="num">
        Página {page} de {total}
      </span>
      <button className="btn btn-secondary btn-sm" onClick={() => setPage(page + 1)} disabled={page >= total}>
        Siguiente
      </button>
    </div>
  );
}
