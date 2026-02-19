export type ThemeKey = 'sofiya' | 'classic' | 'focus' | 'zen';

export interface ThemeConfig {
  name: string;
  subtitle: string;
  primary: string;
  primaryRGB: string;
  secondary: string;
  textClass: string;
  bgGradient: string;
  accentColor: string;
}

export const THEMES: Record<ThemeKey, ThemeConfig> = {
  sofiya: {
    name: 'SOFIYA',
    subtitle: 'ADVANCED AI ASSISTANT',
    primary: '#8b5cf6',
    primaryRGB: '139, 92, 246',
    secondary: '#a78bfa',
    textClass: 'text-violet-400',
    bgGradient: 'from-violet-900/20 to-black',
    accentColor: 'violet'
  },
  classic: {
    name: 'CLASSIC',
    subtitle: 'STANDARD INTERFACE',
    primary: '#06b6d4',
    primaryRGB: '6, 182, 212',
    secondary: '#22d3ee',
    textClass: 'text-cyan-400',
    bgGradient: 'from-cyan-900/20 to-black',
    accentColor: 'cyan'
  },
  focus: {
    name: 'FOCUS',
    subtitle: 'PRODUCTIVITY MODE',
    primary: '#ef4444',
    primaryRGB: '239, 68, 68',
    secondary: '#f87171',
    textClass: 'text-red-400',
    bgGradient: 'from-red-900/20 to-black',
    accentColor: 'red'
  },
  zen: {
    name: 'ZEN',
    subtitle: 'MINDFULNESS PROTOCOL',
    primary: '#10b981',
    primaryRGB: '16, 185, 129',
    secondary: '#34d399',
    textClass: 'text-emerald-400',
    bgGradient: 'from-emerald-900/20 to-black',
    accentColor: 'emerald'
  }
};

class ThemeService {
  private currentTheme: ThemeKey = 'sofiya';
  private themeStorageKey = 'sofiya_theme';

  constructor() {
    this.loadTheme();
  }

  setTheme(theme: ThemeKey) {
    if (!THEMES[theme]) return;
    this.currentTheme = theme;
    localStorage.setItem(this.themeStorageKey, theme);
    this.applyTheme(theme);
  }

  getTheme(): ThemeConfig {
    return THEMES[this.currentTheme];
  }

  getCurrentThemeKey(): ThemeKey {
    return this.currentTheme;
  }

  getAllThemes(): ThemeKey[] {
    return Object.keys(THEMES) as ThemeKey[];
  }

  private loadTheme() {
    const saved = localStorage.getItem(this.themeStorageKey) as ThemeKey;
    if (saved && THEMES[saved]) {
      this.currentTheme = saved;
    }
    this.applyTheme(this.currentTheme);
  }

  private applyTheme(theme: ThemeKey) {
    const config = THEMES[theme];
    document.documentElement.style.setProperty('--primary-glow', config.primaryRGB);
    document.documentElement.setAttribute('data-theme', theme);
  }
}

export const themeService = new ThemeService();
