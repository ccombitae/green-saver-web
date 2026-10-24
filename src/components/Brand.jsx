import { Link } from "react-router-dom";

// Logo de Green Saver: sol con panel solar, casa y flecha de ahorro.
export function BrandMark({ className = "brand-mark" }) {
  return (
    <span className={className} aria-hidden="true">
      <img src="/logo-emblema.png" alt="" />
    </span>
  );
}

export function Brand({ to = "/" }) {
  return (
    <Link to={to} className="brand" aria-label="Green Saver, ir al inicio">
      <BrandMark />
      <span className="brand-name">
        <span className="brand-green">Green</span> <span className="brand-saver">Saver</span>
      </span>
    </Link>
  );
}
