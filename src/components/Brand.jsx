import { Link } from "react-router-dom";

export function BrandMark({ className = "brand-mark" }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#0E6B45" />
      <circle cx="32" cy="27" r="11" fill="#F2B21B" />
      <path d="M14 46h36l-6 8H20z" fill="#E9F5EE" />
    </svg>
  );
}

export function Brand({ to = "/" }) {
  return (
    <Link to={to} className="brand" aria-label="Green Saver, ir al inicio">
      <BrandMark />
      Green Saver
    </Link>
  );
}
