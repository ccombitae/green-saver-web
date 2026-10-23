// Ilustraciones propias en SVG (sin fotos de terceros): casa con paneles,
// campo solar y los iconos de los pasos. Pesan poco y se ven nítidas en
// cualquier pantalla.

function PanelGrid({ x, y, cols, rows, w, h, gap = 4, skew = -24 }) {
  const cells = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const px = c * (w + gap);
      const py = r * (h + gap);
      cells.push(
        <g key={`${r}-${c}`}>
          <rect
            x={px}
            y={py}
            width={w}
            height={h}
            rx="2"
            fill="url(#gs-cell)"
            stroke="#0b2a4a"
            strokeWidth="1"
          />
          <line
            x1={px + w / 3}
            y1={py}
            x2={px + w / 3}
            y2={py + h}
            stroke="#5d8fc4"
            strokeOpacity=".45"
            strokeWidth=".8"
          />
          <line
            x1={px + (2 * w) / 3}
            y1={py}
            x2={px + (2 * w) / 3}
            y2={py + h}
            stroke="#5d8fc4"
            strokeOpacity=".45"
            strokeWidth=".8"
          />
          <line
            x1={px}
            y1={py + h / 2}
            x2={px + w}
            y2={py + h / 2}
            stroke="#5d8fc4"
            strokeOpacity=".45"
            strokeWidth=".8"
          />
          <path
            d={`M${px + 3} ${py + h - 4} L${px + w * 0.55} ${py + 3}`}
            stroke="#fff"
            strokeOpacity=".35"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>,
      );
    }
  }
  return <g transform={`translate(${x} ${y}) skewX(${skew})`}>{cells}</g>;
}

function Defs() {
  return (
    <defs>
      <linearGradient id="gs-cell" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#2f6fb3" />
        <stop offset=".55" stopColor="#163f73" />
        <stop offset="1" stopColor="#0d2b52" />
      </linearGradient>
      <linearGradient id="gs-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff4d6" />
        <stop offset="1" stopColor="#e9f5ee" />
      </linearGradient>
      <radialGradient id="gs-sun" cx=".5" cy=".5" r=".5">
        <stop offset="0" stopColor="#ffd75e" />
        <stop offset="1" stopColor="#f2b21b" />
      </radialGradient>
    </defs>
  );
}

function Sun({ cx, cy, r, rays = true }) {
  const lines = rays
    ? Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * (r + 8)}
            y1={cy + Math.sin(a) * (r + 8)}
            x2={cx + Math.cos(a) * (r + 20)}
            y2={cy + Math.sin(a) * (r + 20)}
            stroke="#f2b21b"
            strokeWidth="4"
            strokeLinecap="round"
          />
        );
      })
    : null;
  return (
    <g className="gs-sun">
      <circle cx={cx} cy={cy} r={r + 26} fill="#f2b21b" opacity=".12" />
      {lines}
      <circle cx={cx} cy={cy} r={r} fill="url(#gs-sun)" />
    </g>
  );
}

function Cloud({ x, y, s = 1, opacity = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
      <ellipse cx="30" cy="20" rx="30" ry="14" fill="#fff" />
      <ellipse cx="52" cy="14" rx="20" ry="13" fill="#fff" />
      <ellipse cx="14" cy="16" rx="14" ry="10" fill="#fff" />
    </g>
  );
}

/** Escena principal: casa con paneles bajo el sol del Tolima/Cundinamarca. */
export function SolarHouseScene({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 600 360"
      role="img"
      aria-label="Casa con paneles solares en el techo bajo el sol"
    >
      <Defs />
      <clipPath id="gs-hero-clip">
        <rect width="600" height="360" rx="28" />
      </clipPath>
      <g clipPath="url(#gs-hero-clip)">
        <rect width="600" height="360" fill="url(#gs-sky)" />
        <Sun cx={488} cy={86} r={38} />
        <Cloud x={70} y={50} s={1.1} />
        <Cloud x={300} y={92} s={0.8} opacity={0.9} />

        {/* montañas y colinas */}
        <path
          d="M0 250 L90 170 L160 225 L250 150 L360 240 L600 200 L600 360 L0 360 Z"
          fill="#b9dcc6"
        />
        <path
          d="M0 285 C120 240 220 270 330 255 C430 242 520 250 600 236 L600 360 L0 360 Z"
          fill="#5fb487"
        />
        <path
          d="M0 318 C140 296 300 310 600 290 L600 360 L0 360 Z"
          fill="#2f8f5b"
        />

        {/* palma */}
        <path
          d="M92 300 C96 262 100 236 108 214"
          stroke="#7a5a3a"
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
        />
        <g fill="#1f7a4b">
          <path d="M108 214 C84 200 64 206 50 220 C72 210 90 212 108 214Z" />
          <path d="M108 214 C96 190 78 182 60 186 C82 192 96 202 108 214Z" />
          <path d="M108 214 C120 190 140 184 156 190 C136 194 122 202 108 214Z" />
          <path d="M108 214 C132 206 152 212 164 226 C146 216 128 214 108 214Z" />
        </g>

        {/* casa */}
        <rect
          x="196"
          y="214"
          width="236"
          height="96"
          fill="#fbf6ea"
          stroke="#d9cfb8"
        />
        <path d="M180 218 L238 150 L452 150 L452 218 Z" fill="#c4603d" />
        <path d="M180 218 L238 150 L246 150 L190 218 Z" fill="#a24c2f" />
        <PanelGrid x={290} y={160} cols={4} rows={2} w={34} h={22} skew={-38} />
        <rect x="224" y="246" width="34" height="64" rx="3" fill="#0e6b45" />
        <circle cx="251" cy="280" r="2.5" fill="#f2b21b" />
        <rect
          x="292"
          y="240"
          width="54"
          height="40"
          rx="4"
          fill="#cfe7f7"
          stroke="#9cc3dd"
        />
        <line x1="319" y1="240" x2="319" y2="280" stroke="#9cc3dd" />
        <rect
          x="366"
          y="240"
          width="46"
          height="40"
          rx="4"
          fill="#cfe7f7"
          stroke="#9cc3dd"
        />

        {/* inversor y batería */}
        <rect
          x="440"
          y="262"
          width="26"
          height="34"
          rx="4"
          fill="#ffffff"
          stroke="#0e6b45"
          strokeWidth="2"
        />
        <path d="M449 272 l6 0 -4 8 6 0 -9 11 3 -8 -5 0z" fill="#f2b21b" />
        <path
          d="M432 176 C448 176 452 200 453 262"
          stroke="#0e6b45"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 4"
        />

        {/* indicador de energía */}
        <g transform="translate(470 196)">
          <rect
            width="100"
            height="40"
            rx="12"
            fill="#ffffff"
            stroke="#e1ece5"
          />
          <text
            x="50"
            y="18"
            textAnchor="middle"
            fontSize="11"
            fill="#4a5b52"
            fontFamily="Instrument Sans, sans-serif"
          >
            Energía limpia
          </text>
          <text
            x="50"
            y="33"
            textAnchor="middle"
            fontSize="13"
            fontWeight="700"
            fill="#0e6b45"
            fontFamily="Bricolage Grotesque, sans-serif"
          >
            para tu hogar
          </text>
        </g>
      </g>
    </svg>
  );
}

/** Campo de paneles para el panel lateral de ingreso/registro (fondo verde oscuro). */
export function SolarFieldScene({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 520 300"
      role="img"
      aria-label="Campo de paneles solares al amanecer"
    >
      <Defs />
      <clipPath id="gs-field-clip">
        <rect width="520" height="300" rx="24" />
      </clipPath>
      <rect width="520" height="300" rx="24" fill="#ffffff" opacity=".05" />
      <g clipPath="url(#gs-field-clip)">
        <Sun cx={380} cy={92} r={44} />
        <path
          d="M0 210 C120 180 260 200 520 170 L520 300 L0 300 Z"
          fill="#0e6b45"
        />
        <path
          d="M0 250 C160 228 320 246 520 222 L520 300 L0 300 Z"
          fill="#00a859"
          opacity=".55"
        />
        {[
          [30, 196, 3],
          [190, 186, 3],
          [350, 176, 3],
          [90, 240, 4],
          [300, 230, 4],
        ].map(([x, y, cols], i) => (
          <g key={i}>
            <line
              x1={x + 34}
              y1={y + 26}
              x2={x + 34}
              y2={y + 46}
              stroke="#cfe3d6"
              strokeWidth="3"
            />
            <line
              x1={x + 92}
              y1={y + 26}
              x2={x + 92}
              y2={y + 46}
              stroke="#cfe3d6"
              strokeWidth="3"
            />
            <PanelGrid
              x={x + 14}
              y={y}
              cols={cols}
              rows={1}
              w={30}
              h={26}
              gap={3}
              skew={-30}
            />
          </g>
        ))}
      </g>
    </svg>
  );
}

/** Iconos de “Cómo calculamos”. */
export function StepIcon({ kind }) {
  const common = {
    viewBox: "0 0 64 64",
    className: "step-icon",
    "aria-hidden": true,
  };
  if (kind === "bill") {
    return (
      <svg {...common}>
        <rect width="64" height="64" rx="16" fill="#fdf3d8" />
        <path
          d="M20 12h24v40l-4-3-4 3-4-3-4 3-4-3-4 3z"
          fill="#fff"
          stroke="#8a5a00"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M26 22h12M26 29h12M26 36h7"
          stroke="#8a5a00"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M36 34l-4 7h5l-4 7"
          stroke="#f2b21b"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === "sun") {
    return (
      <svg {...common}>
        <rect width="64" height="64" rx="16" fill="#fdf3d8" />
        <circle cx="28" cy="26" r="10" fill="#f2b21b" />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          return (
            <line
              key={i}
              x1={28 + Math.cos(a) * 14}
              y1={26 + Math.sin(a) * 14}
              x2={28 + Math.cos(a) * 19}
              y2={26 + Math.sin(a) * 19}
              stroke="#f2b21b"
              strokeWidth="3"
              strokeLinecap="round"
            />
          );
        })}
        <path
          d="M24 48a8 8 0 0 1 2-15 10 10 0 0 1 19 2 7 7 0 0 1 1 13z"
          fill="#fff"
          stroke="#6f7f76"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect width="64" height="64" rx="16" fill="#e7f3ec" />
      <g transform="translate(16 18) skewX(-18)">
        {[0, 1, 2].map((c) =>
          [0, 1].map((r) => (
            <rect
              key={`${c}${r}`}
              x={c * 12}
              y={r * 12}
              width="11"
              height="11"
              rx="1.5"
              fill="url(#gs-cell-icon)"
            />
          )),
        )}
      </g>
      <defs>
        <linearGradient id="gs-cell-icon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2f6fb3" />
          <stop offset="1" stopColor="#0d2b52" />
        </linearGradient>
      </defs>
      <path
        d="M26 44v8M38 44v8M20 52h24"
        stroke="#0e6b45"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Banner pequeño para el inicio del usuario. */
export function MiniRoof({ className }) {
  return (
    <svg className={className} viewBox="0 0 220 120" aria-hidden="true">
      <Defs />
      <Sun cx={176} cy={34} r={16} rays={false} />
      <path d="M10 104 L52 50 L190 50 L190 104 Z" fill="#c4603d" />
      <PanelGrid
        x={78}
        y={58}
        cols={4}
        rows={2}
        w={20}
        h={16}
        gap={3}
        skew={-38}
      />
    </svg>
  );
}
