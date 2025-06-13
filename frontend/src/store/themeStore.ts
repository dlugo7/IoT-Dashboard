import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeStore {
  mode: ThemeMode;
  isDarkMode: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  initializeTheme: () => void;
}

// Helper function to detect system theme preference
const getSystemTheme = (): boolean => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

// Helper function to determine if dark mode should be active
const shouldUseDarkMode = (mode: ThemeMode): boolean => {
  switch (mode) {
    case 'dark':
      return true;
    case 'light':
      return false;
    case 'auto':
      return getSystemTheme();
    default:
      return false;
  }
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: 'auto',
      isDarkMode: getSystemTheme(),

      setThemeMode: (mode: ThemeMode) => {
        const isDarkMode = shouldUseDarkMode(mode);
        set({ mode, isDarkMode });
        
        // Update document class for CSS-based theming if needed
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
        }
      },

      toggleTheme: () => {
        const currentMode = get().mode;
        const newMode = currentMode === 'light' ? 'dark' : 'light';
        get().setThemeMode(newMode);
      },

      initializeTheme: () => {
        const { mode } = get();
        const isDarkMode = shouldUseDarkMode(mode);
        set({ isDarkMode });
        
        // Set initial document attribute
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
        }

        // Listen for system theme changes when in auto mode
        if (typeof window !== 'undefined') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handleChange = (e: MediaQueryListEvent) => {
            const currentMode = get().mode;
            if (currentMode === 'auto') {
              set({ isDarkMode: e.matches });
              document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            }
          };

          mediaQuery.addEventListener('change', handleChange);
          
          // Return cleanup function
          return () => mediaQuery.removeEventListener('change', handleChange);
        }
      },
    }),
    {
      name: 'theme-store',
      partialize: (state) => ({ mode: state.mode }),
    }
  )
); 