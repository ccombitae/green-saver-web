// Sesión del usuario: guarda los tokens en localStorage, restaura la sesión al
// recargar y expone login, registro y cierre de sesión.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { configureSession, setTokens } from "../api/client";
import { auth as authApi } from "../api/endpoints";

const STORAGE_KEY = "greensaver-web-session";
const AuthContext = createContext(null);

const readStored = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
};

const toSession = (data) => ({
  user: { id: data.id, email: data.email, name: data.name, phone: data.phone, role: data.role },
  token: data.access_token,
  refreshToken: data.refresh_token,
});

export function AuthProvider({ children }) {
  // La sesión guardada se entrega al cliente HTTP de inmediato, antes de que las
  // páginas hijas hagan sus primeras peticiones (sus efectos corren primero).
  const [state, setState] = useState(() => {
    const stored = readStored();
    setTokens(stored?.token ?? null, stored?.refreshToken ?? null);
    return stored;
  });
  const [expired, setExpired] = useState(false);

  const persist = useCallback((next) => {
    setState(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* almacenamiento no disponible: la sesión vive solo en memoria */
    }
  }, []);

  useEffect(() => {
    configureSession({
      token: state?.token,
      refreshToken: state?.refreshToken,
      onChange: (data) => {
        setState((prev) => {
          const next = prev ? { ...prev, token: data.access_token, refreshToken: data.refresh_token ?? prev.refreshToken } : prev;
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch {
            /* sin almacenamiento */
          }
          return next;
        });
      },
      onExpired: () => {
        setExpired(true);
        persist(null);
      },
    });
  }, [state?.token, state?.refreshToken, persist]);

  const login = useCallback(
    async (email, password) => {
      const data = await authApi.login(email.trim().toLowerCase(), password);
      const next = toSession(data);
      setTokens(next.token, next.refreshToken);
      setExpired(false);
      persist(next);
      return next.user;
    },
    [persist]
  );

  const register = useCallback(
    async (form) => {
      const data = await authApi.register({ ...form, email: form.email.trim().toLowerCase() });
      const next = toSession(data);
      setTokens(next.token, next.refreshToken);
      persist(next);
      return next.user;
    },
    [persist]
  );

  const logout = useCallback(() => {
    setTokens(null, null);
    persist(null);
  }, [persist]);

  const value = useMemo(
    () => ({ user: state?.user ?? null, isAdmin: state?.user?.role === "admin", login, register, logout, expired }),
    [state, login, register, logout, expired]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
