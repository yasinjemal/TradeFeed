// ============================================================
// Custom SVG Illustrations — TradeFeed Theme
// ============================================================
// Lightweight inline SVGs designed with the emerald/stone
// TradeFeed palette. No external dependencies.
//
// Usage: <IllustrationEmptyBox className="w-48 h-48" />
// ============================================================

interface IllustrationProps {
  className?: string;
}

/* ─────────────────────────────────────────────────────────── */
/* 1. Empty Box — No products, no items                       */
/* ─────────────────────────────────────────────────────────── */
export function IllustrationEmptyBox({ className = "w-48 h-48" }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="100" cy="175" rx="60" ry="8" fill="#e7e5e4" opacity="0.6" />
      {/* Box body */}
      <path d="M50 80L100 55L150 80V140L100 165L50 140V80Z" fill="#fafaf9" stroke="#d6d3d1" strokeWidth="2" />
      {/* Box front face */}
      <path d="M50 80L100 105V165L50 140V80Z" fill="#f5f5f4" stroke="#d6d3d1" strokeWidth="2" />
      {/* Box right face */}
      <path d="M150 80L100 105V165L150 140V80Z" fill="#e7e5e4" stroke="#d6d3d1" strokeWidth="2" />
      {/* Box lid left */}
      <path d="M50 80L100 55L100 72L55 94L50 80Z" fill="#10b981" opacity="0.15" stroke="#10b981" strokeWidth="1.5" />
      {/* Box lid right */}
      <path d="M150 80L100 55L100 72L145 94L150 80Z" fill="#10b981" opacity="0.2" stroke="#10b981" strokeWidth="1.5" />
      {/* Lid flaps open */}
      <path d="M50 80L35 62L85 38L100 55L50 80Z" fill="#ecfdf5" stroke="#34d399" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M150 80L165 62L115 38L100 55L150 80Z" fill="#d1fae5" stroke="#34d399" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Sparkles */}
      <circle cx="75" cy="45" r="3" fill="#34d399" opacity="0.5">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="135" cy="40" r="2" fill="#10b981" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="160" cy="55" r="2.5" fill="#6ee7b7" opacity="0.6">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="1.8s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* 2. Empty Cart — Shopping cart is empty                      */
/* ─────────────────────────────────────────────────────────── */
export function IllustrationEmptyCart({ className = "w-48 h-48" }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="100" cy="178" rx="55" ry="7" fill="#e7e5e4" opacity="0.5" />
      {/* Cart body */}
      <path d="M45 65H55L75 140H145L160 85H70" stroke="#a8a29e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Cart basket fill */}
      <path d="M70 85H160L145 140H75L70 85Z" fill="#fafaf9" stroke="#d6d3d1" strokeWidth="2" />
      {/* Cart handle */}
      <path d="M35 58H50" stroke="#a8a29e" strokeWidth="3" strokeLinecap="round" />
      {/* Wheels */}
      <circle cx="88" cy="155" r="8" fill="#f5f5f4" stroke="#a8a29e" strokeWidth="2.5" />
      <circle cx="135" cy="155" r="8" fill="#f5f5f4" stroke="#a8a29e" strokeWidth="2.5" />
      <circle cx="88" cy="155" r="3" fill="#d6d3d1" />
      <circle cx="135" cy="155" r="3" fill="#d6d3d1" />
      {/* Sad face inside cart */}
      <circle cx="105" cy="108" r="3" fill="#a8a29e" />
      <circle cx="125" cy="108" r="3" fill="#a8a29e" />
      <path d="M108 122C112 118 122 118 126 122" stroke="#a8a29e" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Floating dashed lines (emptiness) */}
      <path d="M90 90H140" stroke="#d6d3d1" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
      <path d="M85 130H145" stroke="#d6d3d1" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
      {/* Sparkle */}
      <path d="M160 65L163 60L166 65L163 70Z" fill="#34d399" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* 3. Empty Heart — No wishlist / favourites                  */
/* ─────────────────────────────────────────────────────────── */
export function IllustrationEmptyHeart({ className = "w-48 h-48" }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="100" cy="175" rx="45" ry="6" fill="#e7e5e4" opacity="0.5" />
      {/* Main heart outline */}
      <path
        d="M100 160C100 160 40 120 40 80C40 55 60 40 80 40C92 40 100 50 100 50C100 50 108 40 120 40C140 40 160 55 160 80C160 120 100 160 100 160Z"
        fill="#fef2f2" stroke="#fca5a5" strokeWidth="2.5"
      />
      {/* Inner dashed heart (emptiness) */}
      <path
        d="M100 140C100 140 58 108 58 78C58 62 72 52 84 52C92 52 100 60 100 60C100 60 108 52 116 52C128 52 142 62 142 78C142 108 100 140 100 140Z"
        fill="none" stroke="#fecaca" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.7"
      />
      {/* Small hearts floating */}
      <path d="M52 50C52 50 48 44 44 44C40 44 36 48 36 52C36 60 52 66 52 66C52 66 68 60 68 52C68 48 64 44 60 44C56 44 52 50 52 50Z" fill="#fca5a5" opacity="0.3">
        <animateTransform attributeName="transform" type="translate" values="0,0;-3,-8;0,0" dur="3s" repeatCount="indefinite" />
      </path>
      <path d="M155 45C155 45 152 41 149 41C146 41 143 44 143 47C143 53 155 57 155 57C155 57 167 53 167 47C167 44 164 41 161 41C158 41 155 45 155 45Z" fill="#f87171" opacity="0.25">
        <animateTransform attributeName="transform" type="translate" values="0,0;4,-6;0,0" dur="2.5s" repeatCount="indefinite" />
      </path>
      {/* Sparkles */}
      <circle cx="70" cy="35" r="2" fill="#34d399" opacity="0.5">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="140" cy="32" r="2.5" fill="#10b981" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* 4. Search Not Found — No search results                    */
/* ─────────────────────────────────────────────────────────── */
export function IllustrationSearchNotFound({ className = "w-48 h-48" }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="100" cy="178" rx="50" ry="6" fill="#e7e5e4" opacity="0.5" />
      {/* Magnifying glass circle */}
      <circle cx="90" cy="85" r="42" fill="#f5f5f4" stroke="#d6d3d1" strokeWidth="3" />
      <circle cx="90" cy="85" r="34" fill="#fafaf9" stroke="#e7e5e4" strokeWidth="1.5" />
      {/* Magnifying glass handle */}
      <path d="M122 117L155 150" stroke="#a8a29e" strokeWidth="6" strokeLinecap="round" />
      <path d="M122 117L155 150" stroke="#d6d3d1" strokeWidth="3" strokeLinecap="round" />
      {/* X mark inside glass */}
      <path d="M78 73L102 97" stroke="#f87171" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <path d="M102 73L78 97" stroke="#f87171" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      {/* Question marks floating */}
      <text x="45" y="50" fontSize="16" fill="#d6d3d1" fontFamily="sans-serif" fontWeight="bold">?</text>
      <text x="140" y="60" fontSize="12" fill="#e7e5e4" fontFamily="sans-serif" fontWeight="bold">?</text>
      <text x="155" y="90" fontSize="14" fill="#d6d3d1" fontFamily="sans-serif" fontWeight="bold">?</text>
      {/* Sparkle */}
      <circle cx="55" cy="38" r="2.5" fill="#34d399" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* 5. Error / Broken — Something went wrong                   */
/* ─────────────────────────────────────────────────────────── */
export function IllustrationError({ className = "w-48 h-48" }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="100" cy="178" rx="55" ry="7" fill="#e7e5e4" opacity="0.5" />
      {/* Warning triangle */}
      <path d="M100 35L165 155H35L100 35Z" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M100 50L155 148H45L100 50Z" fill="#fffbeb" stroke="#fbbf24" strokeWidth="1" strokeLinejoin="round" />
      {/* Exclamation mark */}
      <rect x="96" y="75" width="8" height="40" rx="4" fill="#f59e0b" />
      <circle cx="100" cy="130" r="5" fill="#f59e0b" />
      {/* Lightning bolts */}
      <path d="M38 60L45 72L40 72L48 88" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5" />
      <path d="M162 55L155 67L160 67L152 83" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5" />
      {/* Sparkles */}
      <circle cx="30" cy="45" r="2" fill="#34d399" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="170" cy="42" r="2.5" fill="#10b981" opacity="0.3">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* 6. Not Found (404) — Page / resource missing               */
/* ─────────────────────────────────────────────────────────── */
export function IllustrationNotFound({ className = "w-48 h-48" }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="100" cy="180" rx="60" ry="7" fill="#e7e5e4" opacity="0.5" />
      {/* Map/document with fold */}
      <rect x="45" y="40" width="110" height="130" rx="8" fill="#fafaf9" stroke="#d6d3d1" strokeWidth="2" />
      <path d="M45 40H147C147 40 155 40 155 48V162C155 170 147 170 147 170H45" fill="none" stroke="#d6d3d1" strokeWidth="2" />
      {/* Fold corner */}
      <path d="M130 40L155 65" stroke="#e7e5e4" strokeWidth="1.5" />
      <path d="M130 40V65H155" fill="#f5f5f4" stroke="#d6d3d1" strokeWidth="1.5" strokeLinejoin="round" />
      {/* 404 text */}
      <text x="100" y="108" textAnchor="middle" fontSize="36" fontWeight="bold" fill="#d6d3d1" fontFamily="system-ui, sans-serif">404</text>
      {/* Dashed lines (broken content) */}
      <path d="M65 125H135" stroke="#e7e5e4" strokeWidth="2" strokeDasharray="6 4" />
      <path d="M75 140H125" stroke="#e7e5e4" strokeWidth="2" strokeDasharray="6 4" />
      <path d="M80 155H120" stroke="#e7e5e4" strokeWidth="2" strokeDasharray="6 4" />
      {/* Compass pointer — lost */}
      <circle cx="162" cy="45" r="14" fill="#ecfdf5" stroke="#34d399" strokeWidth="1.5" />
      <path d="M162 37L165 45L162 53L159 45Z" fill="#10b981" opacity="0.6" />
      <path d="M162 37L165 45H159Z" fill="#10b981" />
      {/* Sparkles */}
      <circle cx="40" cy="35" r="2.5" fill="#34d399" opacity="0.5">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="172" cy="80" r="2" fill="#6ee7b7" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* 7. No Reviews — Star outline                               */
/* ─────────────────────────────────────────────────────────── */
export function IllustrationNoReviews({ className = "w-48 h-48" }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="100" cy="178" rx="50" ry="6" fill="#e7e5e4" opacity="0.5" />
      {/* Main star */}
      <path
        d="M100 30L118 72L164 78L130 110L138 156L100 135L62 156L70 110L36 78L82 72L100 30Z"
        fill="#fffbeb" stroke="#fbbf24" strokeWidth="2.5" strokeLinejoin="round"
      />
      {/* Inner dashed star */}
      <path
        d="M100 52L112 80L142 84L120 104L126 134L100 120L74 134L80 104L58 84L88 80L100 52Z"
        fill="none" stroke="#fde68a" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.7"
      />
      {/* Chat bubble */}
      <path d="M142 30H172C176 30 180 34 180 38V58C180 62 176 66 172 66H158L152 74L148 66H142C138 66 134 62 134 58V38C134 34 138 30 142 30Z" fill="#f5f5f4" stroke="#d6d3d1" strokeWidth="1.5" />
      {/* Dots in chat bubble */}
      <circle cx="150" cy="48" r="2.5" fill="#d6d3d1" />
      <circle cx="160" cy="48" r="2.5" fill="#d6d3d1" />
      <circle cx="170" cy="48" r="2.5" fill="#d6d3d1" />
      {/* Sparkles */}
      <circle cx="35" cy="65" r="2" fill="#34d399" opacity="0.5">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="28" cy="115" r="2.5" fill="#10b981" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* 8. No Chart Data — Empty analytics                         */
/* ─────────────────────────────────────────────────────────── */
export function IllustrationNoChart({ className = "w-48 h-48" }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="100" cy="178" rx="55" ry="6" fill="#e7e5e4" opacity="0.5" />
      {/* Chart axes */}
      <path d="M40 160H170" stroke="#d6d3d1" strokeWidth="2" strokeLinecap="round" />
      <path d="M40 160V40" stroke="#d6d3d1" strokeWidth="2" strokeLinecap="round" />
      {/* Grid lines */}
      <path d="M40 120H170" stroke="#e7e5e4" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
      <path d="M40 80H170" stroke="#e7e5e4" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
      {/* Ghost bars */}
      <rect x="55" y="110" width="18" height="50" rx="4" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1.5" strokeDasharray="4 3" />
      <rect x="85" y="85" width="18" height="75" rx="4" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1.5" strokeDasharray="4 3" />
      <rect x="115" y="100" width="18" height="60" rx="4" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1.5" strokeDasharray="4 3" />
      <rect x="145" y="70" width="18" height="90" rx="4" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1.5" strokeDasharray="4 3" />
      {/* Upward trend arrow (aspirational) */}
      <path d="M60 130L95 100L125 115L155 75" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 4" opacity="0.5" />
      <path d="M148 72L158 72L158 82" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      {/* Sparkles */}
      <circle cx="168" cy="55" r="2.5" fill="#34d399" opacity="0.5">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="35" cy="35" r="2" fill="#10b981" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* 9. Rocket — Coming soon / upgrade                          */
/* ─────────────────────────────────────────────────────────── */
export function IllustrationRocket({ className = "w-48 h-48" }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Stars background */}
      <circle cx="30" cy="40" r="2" fill="#d6d3d1" opacity="0.6" />
      <circle cx="170" cy="30" r="2.5" fill="#d6d3d1" opacity="0.5" />
      <circle cx="160" cy="90" r="1.5" fill="#d6d3d1" opacity="0.4" />
      <circle cx="25" cy="110" r="2" fill="#d6d3d1" opacity="0.5" />
      <circle cx="50" cy="60" r="1.5" fill="#d6d3d1" opacity="0.3" />
      {/* Rocket body */}
      <path d="M100 30C100 30 80 70 80 110C80 130 90 145 100 155C110 145 120 130 120 110C120 70 100 30 100 30Z" fill="#fafaf9" stroke="#a8a29e" strokeWidth="2" />
      {/* Rocket nose cone */}
      <path d="M100 30C100 30 88 60 88 60L112 60C112 60 100 30 100 30Z" fill="#10b981" stroke="#059669" strokeWidth="1.5" />
      {/* Rocket window */}
      <circle cx="100" cy="85" r="10" fill="#ecfdf5" stroke="#34d399" strokeWidth="2" />
      <circle cx="100" cy="85" r="5" fill="#d1fae5" />
      {/* Fins */}
      <path d="M80 120L60 145L80 140Z" fill="#10b981" stroke="#059669" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M120 120L140 145L120 140Z" fill="#10b981" stroke="#059669" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Flame */}
      <path d="M90 155C90 155 95 175 100 180C105 175 110 155 110 155" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1">
        <animate attributeName="d" values="M90 155C90 155 95 175 100 180C105 175 110 155 110 155;M92 155C92 155 96 172 100 176C104 172 108 155 108 155;M90 155C90 155 95 175 100 180C105 175 110 155 110 155" dur="0.5s" repeatCount="indefinite" />
      </path>
      <path d="M94 155C94 155 97 168 100 172C103 168 106 155 106 155" fill="#fbbf24">
        <animate attributeName="d" values="M94 155C94 155 97 168 100 172C103 168 106 155 106 155;M95 155C95 155 98 165 100 168C102 165 105 155 105 155;M94 155C94 155 97 168 100 172C103 168 106 155 106 155" dur="0.4s" repeatCount="indefinite" />
      </path>
      {/* Emerald sparkles */}
      <circle cx="45" cy="90" r="2.5" fill="#34d399" opacity="0.5">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="155" cy="60" r="2" fill="#10b981" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* 10. No Orders — Empty clipboard                            */
/* ─────────────────────────────────────────────────────────── */
export function IllustrationNoOrders({ className = "w-48 h-48" }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="100" cy="180" rx="50" ry="6" fill="#e7e5e4" opacity="0.5" />
      {/* Clipboard body */}
      <rect x="55" y="45" width="90" height="125" rx="8" fill="#fafaf9" stroke="#d6d3d1" strokeWidth="2" />
      {/* Clipboard clip */}
      <rect x="80" y="35" width="40" height="20" rx="4" fill="#f5f5f4" stroke="#d6d3d1" strokeWidth="2" />
      <rect x="90" y="30" width="20" height="12" rx="6" fill="#e7e5e4" stroke="#d6d3d1" strokeWidth="1.5" />
      {/* Empty lines */}
      <path d="M72 80H128" stroke="#e7e5e4" strokeWidth="2" strokeDasharray="6 4" />
      <path d="M72 100H128" stroke="#e7e5e4" strokeWidth="2" strokeDasharray="6 4" />
      <path d="M72 120H128" stroke="#e7e5e4" strokeWidth="2" strokeDasharray="6 4" />
      <path d="M72 140H110" stroke="#e7e5e4" strokeWidth="2" strokeDasharray="6 4" />
      {/* Checkboxes (empty) */}
      <rect x="72" y="74" width="12" height="12" rx="2" fill="none" stroke="#d6d3d1" strokeWidth="1.5" />
      <rect x="72" y="94" width="12" height="12" rx="2" fill="none" stroke="#d6d3d1" strokeWidth="1.5" />
      <rect x="72" y="114" width="12" height="12" rx="2" fill="none" stroke="#d6d3d1" strokeWidth="1.5" />
      {/* Pencil leaning */}
      <rect x="148" y="85" width="8" height="65" rx="2" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" transform="rotate(15 152 117)" />
      <path d="M157 148L152 160L147 148" fill="#f5f5f4" stroke="#f59e0b" strokeWidth="1" transform="rotate(15 152 154)" />
      {/* Sparkles */}
      <circle cx="45" cy="55" r="2.5" fill="#34d399" opacity="0.5">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="165" cy="45" r="2" fill="#10b981" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* 11. No Customers — People outlines                         */
/* ─────────────────────────────────────────────────────────── */
export function IllustrationNoCustomers({ className = "w-48 h-48" }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="100" cy="175" rx="55" ry="7" fill="#e7e5e4" opacity="0.5" />
      {/* Center person (larger) */}
      <circle cx="100" cy="68" r="22" fill="#f5f5f4" stroke="#d6d3d1" strokeWidth="2" strokeDasharray="5 3" />
      <path d="M65 135C65 110 80 98 100 98C120 98 135 110 135 135" stroke="#d6d3d1" strokeWidth="2" fill="#fafaf9" strokeDasharray="5 3" />
      {/* Left person (smaller, behind) */}
      <circle cx="50" cy="82" r="15" fill="#f5f5f4" stroke="#e7e5e4" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
      <path d="M28 140C28 122 38 113 50 113C62 113 72 122 72 140" stroke="#e7e5e4" strokeWidth="1.5" fill="none" strokeDasharray="4 3" opacity="0.6" />
      {/* Right person (smaller, behind) */}
      <circle cx="150" cy="82" r="15" fill="#f5f5f4" stroke="#e7e5e4" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
      <path d="M128 140C128 122 138 113 150 113C162 113 172 122 172 140" stroke="#e7e5e4" strokeWidth="1.5" fill="none" strokeDasharray="4 3" opacity="0.6" />
      {/* Plus sign (add customers) */}
      <circle cx="160" cy="55" r="12" fill="#ecfdf5" stroke="#34d399" strokeWidth="1.5" />
      <path d="M160 49V61M154 55H166" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
      {/* Sparkles */}
      <circle cx="30" cy="55" r="2" fill="#34d399" opacity="0.5">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="175" cy="100" r="2.5" fill="#10b981" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
