// =============================================================================
// GastroStock — Design Token System
//
// Single source of truth for all visual constants.
// Consumed by tailwind.config.ts and injected as CSS custom properties.
// Never hardcode colors/spacing/radii — always reference these tokens.
// =============================================================================

// ─── COLOR PALETTE ───────────────────────────────────────────────────────────

export const colors = {
  // Brand Blue — primary action, links, focus rings
  brand: {
    50:  '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',   // ← primary
    600: '#2563eb',   // ← primary dark
    700: '#1d4ed8',   // ← 3D button edge
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  // Slate — text, borders, backgrounds
  slate: {
    50:  '#f8fafc',   // ← app background
    100: '#f1f5f9',   // ← subtle surface
    150: '#eaeff5',   // ← between 100 and 200
    200: '#e2e8f0',   // ← border
    300: '#cbd5e1',   // ← disabled border
    400: '#94a3b8',   // ← placeholder, icon
    500: '#64748b',   // ← secondary text
    600: '#475569',   // ← body text
    700: '#334155',   // ← label
    800: '#1e293b',   // ← heading
    900: '#0f172a',   // ← primary text
    950: '#020617',   // ← sidebar
  },

  // Amber — warnings, accent
  amber: {
    50:  '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',   // ← warning
    600: '#d97706',   // ← warning dark
    700: '#b45309',   // ← 3D button edge
    800: '#92400e',
    900: '#78350f',
  },

  // Green — success, positive stock
  green: {
    50:  '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    500: '#22c55e',   // ← success
    600: '#16a34a',   // ← success dark
    700: '#15803d',   // ← 3D button edge
    800: '#166534',
  },

  // Red — danger, zero stock
  red: {
    50:  '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    500: '#ef4444',   // ← danger
    600: '#dc2626',   // ← danger dark
    700: '#b91c1c',   // ← 3D button edge
    800: '#991b1b',
  },

  // Purple — transfers
  purple: {
    50:  '#faf5ff',
    100: '#f3e8ff',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
  },

  // Cyan — info
  cyan: {
    50:  '#ecfeff',
    100: '#cffafe',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
  },
} as const

// ─── TYPOGRAPHY ──────────────────────────────────────────────────────────────

export const typography = {
  fontFamily: {
    sans: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif',
    mono: 'var(--font-geist-mono), "Fira Code", "Cascadia Code", monospace',
  },

  fontSize: {
    '2xs': ['10px',  { lineHeight: '14px', letterSpacing: '0.04em' }],
    xs:    ['12px',  { lineHeight: '16px', letterSpacing: '0.02em' }],
    sm:    ['13px',  { lineHeight: '20px', letterSpacing: '0.01em' }],
    base:  ['14px',  { lineHeight: '20px' }],
    md:    ['15px',  { lineHeight: '22px' }],
    lg:    ['16px',  { lineHeight: '24px' }],
    xl:    ['18px',  { lineHeight: '28px' }],
    '2xl': ['20px',  { lineHeight: '28px', letterSpacing: '-0.01em' }],
    '3xl': ['24px',  { lineHeight: '32px', letterSpacing: '-0.02em' }],
    '4xl': ['30px',  { lineHeight: '36px', letterSpacing: '-0.02em' }],
    '5xl': ['36px',  { lineHeight: '40px', letterSpacing: '-0.03em' }],
  },

  fontWeight: {
    normal:    '400',
    medium:    '500',
    semibold:  '600',
    bold:      '700',
    extrabold: '800',
  },
} as const

// ─── SPACING ─────────────────────────────────────────────────────────────────
// 4px base unit

export const spacing = {
  px:    '1px',
  0:     '0',
  0.5:   '2px',
  1:     '4px',
  1.5:   '6px',
  2:     '8px',
  2.5:   '10px',
  3:     '12px',
  3.5:   '14px',
  4:     '16px',
  5:     '20px',
  6:     '24px',
  7:     '28px',
  8:     '32px',
  9:     '36px',
  10:    '40px',
  11:    '44px',  // ← minimum touch target (mobile)
  12:    '48px',  // ← large touch target
  14:    '56px',
  16:    '64px',
  20:    '80px',
  24:    '96px',
  32:    '128px',
} as const

// ─── BORDER RADIUS ───────────────────────────────────────────────────────────

export const radius = {
  none:  '0',
  xs:    '4px',
  sm:    '6px',
  md:    '8px',
  lg:    '10px',
  xl:    '12px',    // ← cards, dialogs
  '2xl': '16px',    // ← large panels
  '3xl': '20px',
  full:  '9999px',  // ← pills, avatars
} as const

// ─── SHADOWS ─────────────────────────────────────────────────────────────────

export const shadows = {
  // Elevation system
  xs:   '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm:   '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
  md:   '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
  lg:   '0 10px 24px -4px rgb(0 0 0 / 0.10), 0 4px 8px -4px rgb(0 0 0 / 0.06)',
  xl:   '0 20px 40px -8px rgb(0 0 0 / 0.12), 0 8px 16px -6px rgb(0 0 0 / 0.06)',
  '2xl':'0 24px 48px -12px rgb(0 0 0 / 0.18)',

  // Card shadows
  card:      '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
  cardHover: '0 4px 12px -2px rgb(0 0 0 / 0.10), 0 2px 6px -2px rgb(0 0 0 / 0.06)',

  // Focus ring
  focusRing: '0 0 0 3px rgba(59, 130, 246, 0.18)',

  // 3D Button shadows — the core tactile system
  //
  // Three layers per button state:
  //   1. Inner top highlight  — gives the face a light source
  //   2. Bottom color edge    — the "physical depth" ledge
  //   3. Ambient drop shadow  — grounds the button on the surface
  //
  btn: {
    primary: {
      idle:    '0 1px 0 rgba(255,255,255,0.15) inset, 0 4px 0 #1d4ed8, 0 6px 12px rgba(37,99,235,0.28)',
      hover:   '0 1px 0 rgba(255,255,255,0.15) inset, 0 5px 0 #1d4ed8, 0 8px 16px rgba(37,99,235,0.35)',
      active:  '0 -1px 0 rgba(0,0,0,0.12) inset,     0 1px 0 #1d4ed8, 0 2px 6px  rgba(37,99,235,0.20)',
    },
    secondary: {
      idle:    '0 1px 0 rgba(255,255,255,0.9) inset, 0 3px 0 #94a3b8, 0 5px 8px rgba(0,0,0,0.07)',
      hover:   '0 1px 0 rgba(255,255,255,0.9) inset, 0 4px 0 #94a3b8, 0 6px 10px rgba(0,0,0,0.09)',
      active:  '0 -1px 0 rgba(0,0,0,0.05) inset,    0 1px 0 #94a3b8, 0 2px 4px  rgba(0,0,0,0.06)',
    },
    danger: {
      idle:    '0 1px 0 rgba(255,255,255,0.15) inset, 0 4px 0 #b91c1c, 0 6px 12px rgba(220,38,38,0.28)',
      hover:   '0 1px 0 rgba(255,255,255,0.15) inset, 0 5px 0 #b91c1c, 0 8px 16px rgba(220,38,38,0.35)',
      active:  '0 -1px 0 rgba(0,0,0,0.12) inset,     0 1px 0 #b91c1c, 0 2px 6px  rgba(220,38,38,0.20)',
    },
    success: {
      idle:    '0 1px 0 rgba(255,255,255,0.15) inset, 0 4px 0 #15803d, 0 6px 12px rgba(22,163,74,0.28)',
      hover:   '0 1px 0 rgba(255,255,255,0.15) inset, 0 5px 0 #15803d, 0 8px 16px rgba(22,163,74,0.35)',
      active:  '0 -1px 0 rgba(0,0,0,0.12) inset,     0 1px 0 #15803d, 0 2px 6px  rgba(22,163,74,0.20)',
    },
    warning: {
      idle:    '0 1px 0 rgba(255,255,255,0.25) inset, 0 4px 0 #b45309, 0 6px 12px rgba(217,119,6,0.25)',
      hover:   '0 1px 0 rgba(255,255,255,0.25) inset, 0 5px 0 #b45309, 0 8px 16px rgba(217,119,6,0.32)',
      active:  '0 -1px 0 rgba(0,0,0,0.10) inset,     0 1px 0 #b45309, 0 2px 6px  rgba(217,119,6,0.18)',
    },
  },
} as const

// ─── TRANSITIONS ─────────────────────────────────────────────────────────────

export const transitions = {
  // Durations
  fast:   '75ms',
  normal: '150ms',
  slow:   '300ms',

  // Easings
  ease:        'cubic-bezier(0.4, 0, 0.2, 1)',
  easeIn:      'cubic-bezier(0.4, 0, 1, 1)',
  easeOut:     'cubic-bezier(0, 0, 0.2, 1)',
  spring:      'cubic-bezier(0.34, 1.56, 0.64, 1)',
  snappy:      'cubic-bezier(0.4, 0, 0.2, 1)',

  // Common combos
  button:  'all 100ms cubic-bezier(0.4, 0, 0.2, 1)',
  hover:   'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  panel:   'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const

// ─── Z-INDEX SCALE ────────────────────────────────────────────────────────────

export const zIndex = {
  hide:     -1,
  base:      0,
  raised:   10,
  dropdown: 20,
  sticky:   30,
  overlay:  40,
  modal:    50,
  popover:  60,
  toast:    70,
  tooltip:  80,
} as const

// ─── COMPONENT TOKENS ────────────────────────────────────────────────────────

export const components = {
  sidebar: {
    width:          '280px',
    widthCollapsed: '72px',
    bg:             colors.slate[950],
    border:         'rgba(255,255,255,0.06)',
    activeItem:     colors.brand[600],
    inactiveItem:   colors.slate[400],
    hoverBg:        'rgba(255,255,255,0.06)',
  },

  header: {
    height: '64px',
    bg:     '#ffffff',
    border: colors.slate[200],
  },

  card: {
    bg:           '#ffffff',
    border:       colors.slate[200],
    borderRadius: radius.xl,
    shadow:       shadows.card,
    shadowHover:  shadows.cardHover,
  },

  input: {
    height:         '40px',
    heightSm:       '32px',
    heightLg:       '48px',
    bg:             '#ffffff',
    border:         colors.slate[200],
    borderFocus:    colors.brand[500],
    borderRadius:   radius.lg,
    placeholderColor: colors.slate[400],
    focusRing:      shadows.focusRing,
  },

  button: {
    heightXs: '28px',
    heightSm: '32px',
    heightMd: '40px',   // default
    heightLg: '44px',   // touch-friendly
    heightXl: '52px',
    translatePress: '2px',   // amount pressed down on click
    translateHover: '-1px',  // amount lifted on hover
  },
} as const

// ─── CSS VARIABLE MAP ─────────────────────────────────────────────────────────
// These are injected into :root in globals.css

export const cssVars = {
  '--color-brand':       colors.brand[600],
  '--color-brand-light': colors.brand[50],
  '--color-bg':          colors.slate[50],
  '--color-surface':     '#ffffff',
  '--color-border':      colors.slate[200],
  '--color-text':        colors.slate[900],
  '--color-text-muted':  colors.slate[500],
  '--sidebar-width':     components.sidebar.width,
  '--sidebar-collapsed': components.sidebar.widthCollapsed,
  '--header-height':     components.header.height,
  '--radius-card':       components.card.borderRadius,
  '--radius-input':      components.input.borderRadius,
  '--shadow-card':       shadows.card,
  '--transition-btn':    transitions.button,
} as const

export type ColorToken    = typeof colors
export type SpacingToken  = typeof spacing
export type ShadowToken   = typeof shadows
export type RadiusToken   = typeof radius
