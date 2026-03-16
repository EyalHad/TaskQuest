export interface ThemeColors {
  surface: string;
  panel: string;
  card: string;
  "card-hover": string;
  default: string;
  subtle: string;
  primary: string;
  secondary: string;
  muted: string;
  inverse: string;
  "neon-purple": string;
  "electric-blue": string;
  "emerald-glow": string;
  crimson: string;
  gold: string;
  "frame-bg": string;
  "frame-border": string;
  "scroll-thumb": string;
  "scroll-thumb-hover": string;
}

export const THEMES: Record<string, { dark: ThemeColors; light: ThemeColors }> = {
  default: {
    dark: {
      surface: "#0f172a",
      panel: "#1e293b",
      card: "#1e293b",
      "card-hover": "#273548",
      default: "#334155",
      subtle: "#1e293b",
      primary: "#f1f5f9",
      secondary: "#94a3b8",
      muted: "#475569",
      inverse: "#0f172a",
      "neon-purple": "#B026FF",
      "electric-blue": "#00E5FF",
      "emerald-glow": "#00FF66",
      crimson: "#FF3366",
      gold: "#FFD700",
      "frame-bg": "#080c14",
      "frame-border": "#1e293b",
      "scroll-thumb": "#334155",
      "scroll-thumb-hover": "#475569",
    },
    light: {
      surface: "#f8fafc",
      panel: "#ffffff",
      card: "#ffffff",
      "card-hover": "#f1f5f9",
      default: "#e2e8f0",
      subtle: "#f1f5f9",
      primary: "#0f172a",
      secondary: "#475569",
      muted: "#94a3b8",
      inverse: "#ffffff",
      "neon-purple": "#9333ea",
      "electric-blue": "#0891b2",
      "emerald-glow": "#059669",
      crimson: "#e11d48",
      gold: "#d97706",
      "frame-bg": "#e2e8f0",
      "frame-border": "#cbd5e1",
      "scroll-thumb": "#cbd5e1",
      "scroll-thumb-hover": "#94a3b8",
    },
  },
  forest: {
    dark: {
      surface: "#0a1f0a",
      panel: "#132613",
      card: "#132613",
      "card-hover": "#1a3a1a",
      default: "#1f4d1f",
      subtle: "#132613",
      primary: "#e8f5e9",
      secondary: "#81c784",
      muted: "#4a7c4f",
      inverse: "#0a1f0a",
      "neon-purple": "#66ff66",
      "electric-blue": "#33cc99",
      "emerald-glow": "#00ff44",
      crimson: "#ff6633",
      gold: "#ccff00",
      "frame-bg": "#050f05",
      "frame-border": "#132613",
      "scroll-thumb": "#1f4d1f",
      "scroll-thumb-hover": "#2d6b2d",
    },
    light: {
      surface: "#f0fdf0",
      panel: "#ffffff",
      card: "#ffffff",
      "card-hover": "#ecfce8",
      default: "#bbf7d0",
      subtle: "#dcfce7",
      primary: "#14532d",
      secondary: "#166534",
      muted: "#6b9e6b",
      inverse: "#ffffff",
      "neon-purple": "#16a34a",
      "electric-blue": "#059669",
      "emerald-glow": "#22c55e",
      crimson: "#ea580c",
      gold: "#65a30d",
      "frame-bg": "#dcfce7",
      "frame-border": "#bbf7d0",
      "scroll-thumb": "#bbf7d0",
      "scroll-thumb-hover": "#86efac",
    },
  },
  ocean: {
    dark: {
      surface: "#0a0f1f",
      panel: "#111827",
      card: "#111827",
      "card-hover": "#1a2540",
      default: "#1e3a5f",
      subtle: "#111827",
      primary: "#e0f2fe",
      secondary: "#7dd3fc",
      muted: "#3b6b8f",
      inverse: "#0a0f1f",
      "neon-purple": "#6699ff",
      "electric-blue": "#00ccff",
      "emerald-glow": "#00ffcc",
      crimson: "#ff3366",
      gold: "#ffcc00",
      "frame-bg": "#050810",
      "frame-border": "#111827",
      "scroll-thumb": "#1e3a5f",
      "scroll-thumb-hover": "#2d5a8f",
    },
    light: {
      surface: "#f0f9ff",
      panel: "#ffffff",
      card: "#ffffff",
      "card-hover": "#e0f2fe",
      default: "#bae6fd",
      subtle: "#e0f2fe",
      primary: "#0c4a6e",
      secondary: "#0369a1",
      muted: "#7aa8c4",
      inverse: "#ffffff",
      "neon-purple": "#4f46e5",
      "electric-blue": "#0284c7",
      "emerald-glow": "#0d9488",
      crimson: "#e11d48",
      gold: "#ca8a04",
      "frame-bg": "#e0f2fe",
      "frame-border": "#bae6fd",
      "scroll-thumb": "#bae6fd",
      "scroll-thumb-hover": "#7dd3fc",
    },
  },
  inferno: {
    dark: {
      surface: "#1f0a0a",
      panel: "#2a1010",
      card: "#2a1010",
      "card-hover": "#3d1515",
      default: "#5c1a1a",
      subtle: "#2a1010",
      primary: "#fee2e2",
      secondary: "#fca5a5",
      muted: "#8b4545",
      inverse: "#1f0a0a",
      "neon-purple": "#ff3366",
      "electric-blue": "#ff6600",
      "emerald-glow": "#ffcc00",
      crimson: "#ff4400",
      gold: "#ff9900",
      "frame-bg": "#100505",
      "frame-border": "#2a1010",
      "scroll-thumb": "#5c1a1a",
      "scroll-thumb-hover": "#7c2525",
    },
    light: {
      surface: "#fff5f5",
      panel: "#ffffff",
      card: "#ffffff",
      "card-hover": "#fee2e2",
      default: "#fecaca",
      subtle: "#fee2e2",
      primary: "#7f1d1d",
      secondary: "#b91c1c",
      muted: "#c47070",
      inverse: "#ffffff",
      "neon-purple": "#dc2626",
      "electric-blue": "#ea580c",
      "emerald-glow": "#d97706",
      crimson: "#dc2626",
      gold: "#b45309",
      "frame-bg": "#fee2e2",
      "frame-border": "#fecaca",
      "scroll-thumb": "#fecaca",
      "scroll-thumb-hover": "#fca5a5",
    },
  },
  royal: {
    dark: {
      surface: "#1a0a2e",
      panel: "#231240",
      card: "#231240",
      "card-hover": "#2e1a55",
      default: "#3d2266",
      subtle: "#231240",
      primary: "#f3e8ff",
      secondary: "#c4b5fd",
      muted: "#6d5a8f",
      inverse: "#1a0a2e",
      "neon-purple": "#cc66ff",
      "electric-blue": "#9966ff",
      "emerald-glow": "#cc99ff",
      crimson: "#ff3399",
      gold: "#ffd700",
      "frame-bg": "#0d0518",
      "frame-border": "#231240",
      "scroll-thumb": "#3d2266",
      "scroll-thumb-hover": "#5a3399",
    },
    light: {
      surface: "#faf5ff",
      panel: "#ffffff",
      card: "#ffffff",
      "card-hover": "#f3e8ff",
      default: "#e9d5ff",
      subtle: "#f3e8ff",
      primary: "#3b0764",
      secondary: "#7c3aed",
      muted: "#a78bfa",
      inverse: "#ffffff",
      "neon-purple": "#9333ea",
      "electric-blue": "#7c3aed",
      "emerald-glow": "#a855f7",
      crimson: "#db2777",
      gold: "#d97706",
      "frame-bg": "#f3e8ff",
      "frame-border": "#e9d5ff",
      "scroll-thumb": "#e9d5ff",
      "scroll-thumb-hover": "#c4b5fd",
    },
  },
};

export const THEME_KEYS = Object.keys(THEMES) as (keyof typeof THEMES)[];

export function applyTheme(themeName: string, mode: "light" | "dark" = "dark") {
  const themeSet = THEMES[themeName] ?? THEMES.default;
  const colors = themeSet[mode];
  const root = document.documentElement;

  for (const [key, value] of Object.entries(colors)) {
    root.style.setProperty(`--color-${key}`, value);
  }

  root.classList.toggle("dark", mode === "dark");
  root.classList.toggle("light", mode === "light");
}
