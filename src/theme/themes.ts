export type Theme = {
  name: string;
  colors: {
    bg: string;
    card: string;
    text: string;
    subtext: string;
    accent: string;
    success: string;
    border: string;
  };
};

export const Themes: Record<string, Theme> = {
  Dark: {
    name: 'Dark',
    colors: {
      bg: '#0f172a',
      card: '#1e293b',
      text: '#e6edf3',
      subtext: '#94a3b8',
      accent: '#3b82f6',
      success: '#22c55e',
      border: '#0f172a',
    },
  },
  Midnight: {
    name: 'Midnight',
    colors: {
      bg: '#0b1020',
      card: '#171e2e',
      text: '#e7ebf0',
      subtext: '#9aa6b2',
      accent: '#4f8ef7',
      success: '#28cf72',
      border: '#10172a',
    },
  },
  Nord: {
    name: 'Nord',
    colors: {
      bg: '#2e3440',
      card: '#3b4252',
      text: '#e5e9f0',
      subtext: '#cfd6e3',
      accent: '#88c0d0',
      success: '#a3be8c',
      border: '#434c5e',
    },
  },
};
