/**
 * Decorative hero illustration: a help-desk screen with a magnifier, chat bubbles
 * and a check mark. Pure SVG drawn with skin tokens, so it recolors with each skin.
 */
export function HeroArt({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 360 260"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* backdrop blob */}
      <path
        d="M52 150c-14-58 30-118 98-124 64-6 96 22 140 30 42 8 66 52 50 98-18 52-74 84-150 86-74 2-124-32-138-90Z"
        fill="var(--art-2)"
        opacity="0.28"
      />

      {/* monitor */}
      <g className="float-slower">
        <rect x="70" y="58" width="200" height="132" rx="14" fill="var(--surface)" />
        <rect
          x="70"
          y="58"
          width="200"
          height="132"
          rx="14"
          stroke="var(--hero-ink)"
          strokeOpacity="0.15"
          strokeWidth="2"
        />
        <rect x="70" y="58" width="200" height="24" rx="12" fill="var(--herb)" />
        <circle cx="86" cy="70" r="4" fill="var(--surface)" opacity="0.8" />
        <circle cx="99" cy="70" r="4" fill="var(--surface)" opacity="0.6" />
        <circle cx="112" cy="70" r="4" fill="var(--surface)" opacity="0.4" />
        {/* search bar on screen */}
        <rect x="88" y="96" width="164" height="22" rx="11" fill="var(--herb-soft)" />
        <rect x="100" y="104" width="70" height="6" rx="3" fill="var(--herb)" opacity="0.5" />
        {/* result rows */}
        <rect x="88" y="130" width="120" height="8" rx="4" fill="var(--line-strong)" />
        <rect x="88" y="146" width="146" height="8" rx="4" fill="var(--line)" />
        <rect x="88" y="162" width="100" height="8" rx="4" fill="var(--line)" />
        <rect x="150" y="190" width="40" height="18" fill="var(--line-strong)" />
        <rect x="124" y="206" width="92" height="10" rx="5" fill="var(--line-strong)" />
      </g>

      {/* magnifier */}
      <g className="float-slow">
        <circle
          cx="262"
          cy="128"
          r="30"
          fill="var(--surface)"
          fillOpacity="0.55"
          stroke="var(--herb)"
          strokeWidth="9"
        />
        <path d="M284 151l26 26" stroke="var(--herb)" strokeWidth="12" strokeLinecap="round" />
        <path
          d="M248 116a16 16 0 0 1 14-8"
          stroke="var(--surface)"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>

      {/* chat bubble */}
      <g className="float-slow">
        <path
          d="M28 52a14 14 0 0 1 14-14h62a14 14 0 0 1 14 14v26a14 14 0 0 1-14 14H60l-16 14v-14h-2a14 14 0 0 1-14-14V52Z"
          fill="var(--art-1)"
        />
        <circle cx="54" cy="65" r="5" fill="var(--surface)" />
        <circle cx="73" cy="65" r="5" fill="var(--surface)" />
        <circle cx="92" cy="65" r="5" fill="var(--surface)" />
      </g>

      {/* solved check */}
      <g className="float-slower">
        <circle cx="300" cy="46" r="22" fill="var(--art-3)" />
        <path
          d="M290 46l7 7 14-15"
          stroke="var(--hero-ink)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* sparkles */}
      <path d="M40 190l4 10 10 4-10 4-4 10-4-10-10-4 10-4 4-10Z" fill="var(--art-3)" />
      <path d="M330 210l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" fill="var(--art-1)" />
      <circle cx="186" cy="30" r="5" fill="var(--art-1)" opacity="0.7" />
      <circle cx="20" cy="130" r="4" fill="var(--herb)" opacity="0.4" />
    </svg>
  );
}
