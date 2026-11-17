/**
 * Decorative illustration for the report page: a smiling call-center agent with a
 * headset, a laptop, a heart speech bubble and sparkles. Colors come from skin tokens.
 */
export function SupportArt({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 340 260" className={className} fill="none">
      {/* backdrop */}
      <circle cx="170" cy="140" r="112" fill="var(--art-2)" opacity="0.3" />
      <circle cx="170" cy="140" r="84" fill="var(--surface)" opacity="0.35" />

      {/* agent */}
      <g className="float-slower">
        {/* body */}
        <path d="M100 236c4-44 34-70 70-70s66 26 70 70Z" fill="var(--herb)" />
        <path d="M152 168l18 22 18-22" fill="var(--surface)" />
        {/* neck + head */}
        <rect x="160" y="148" width="20" height="22" rx="8" fill="#f2c4a0" />
        <circle cx="170" cy="118" r="40" fill="#f6d2b4" />
        {/* hair */}
        <path
          d="M130 116c-2-30 18-50 42-50 26 0 42 18 40 46-10-14-26-20-44-22-12 10-24 18-38 26Z"
          fill="#3a2a22"
        />
        {/* face */}
        <circle cx="156" cy="122" r="4" fill="#3a2a22" />
        <circle cx="184" cy="122" r="4" fill="#3a2a22" />
        <path d="M158 136c6 7 18 7 24 0" stroke="#3a2a22" strokeWidth="4" strokeLinecap="round" />
        <circle cx="147" cy="133" r="6" fill="#f59a8a" opacity="0.5" />
        <circle cx="193" cy="133" r="6" fill="#f59a8a" opacity="0.5" />
        {/* headset */}
        <path
          d="M126 118a44 44 0 0 1 88 0"
          stroke="var(--hero-edge)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <rect x="118" y="110" width="16" height="26" rx="7" fill="var(--art-3)" />
        <rect x="206" y="110" width="16" height="26" rx="7" fill="var(--art-3)" />
        <path
          d="M126 134c0 16 12 22 28 22"
          stroke="var(--hero-edge)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="156" cy="156" r="5" fill="var(--hero-edge)" />
        {/* laptop */}
        <path d="M108 236h124l-10-36H118Z" fill="#dfe7e3" />
        <rect x="96" y="234" width="148" height="8" rx="4" fill="#c4d0ca" />
        <circle cx="170" cy="218" r="5" fill="var(--herb)" opacity="0.6" />
      </g>

      {/* heart bubble */}
      <g className="float-slow">
        <path
          d="M232 34h66a14 14 0 0 1 14 14v30a14 14 0 0 1-14 14h-38l-18 16V92h-10a14 14 0 0 1-14-14V48a14 14 0 0 1 14-14Z"
          fill="var(--surface)"
        />
        <path
          d="M265 80s-17-10-17-21a9 9 0 0 1 17-4 9 9 0 0 1 17 4c0 11-17 21-17 21Z"
          fill="var(--art-3)"
        />
      </g>

      {/* "message sent" bubble */}
      <g className="float-slower">
        <rect x="22" y="62" width="74" height="40" rx="14" fill="var(--art-1)" />
        <path
          d="M44 82l8 8 16-16"
          stroke="var(--surface)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M40 102l-6 14 18-14Z" fill="var(--art-1)" />
      </g>

      {/* sparkles */}
      <path d="M58 168l4 10 10 4-10 4-4 10-4-10-10-4 10-4 4-10Z" fill="var(--art-3)" />
      <path d="M296 150l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" fill="var(--art-1)" />
      <circle cx="120" cy="40" r="5" fill="var(--art-1)" opacity="0.8" />
      <circle cx="310" cy="210" r="4" fill="var(--surface)" opacity="0.7" />
    </svg>
  );
}
