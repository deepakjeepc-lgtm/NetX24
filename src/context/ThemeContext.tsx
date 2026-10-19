import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function syncDocumentStatusBarColor(doc: Document, isDarkMode: boolean, themeColor: string) {
  if (!doc || !doc.documentElement) return;

  if (isDarkMode) {
    doc.documentElement.classList.add('dark');
    doc.documentElement.style.colorScheme = 'dark';
  } else {
    doc.documentElement.classList.remove('dark');
    doc.documentElement.style.colorScheme = 'light';
  }

  doc.documentElement.style.backgroundColor = themeColor;
  if (doc.body) {
    doc.body.style.backgroundColor = themeColor;
  }

  const rootEl = doc.getElementById('root');
  if (rootEl) {
    rootEl.style.backgroundColor = themeColor;
  }

  if (doc.head) {
    const existingMetas = doc.head.querySelectorAll('meta[name="theme-color"]');
    existingMetas.forEach((m) => m.remove());

    const freshMeta = doc.createElement('meta');
    freshMeta.setAttribute('name', 'theme-color');
    freshMeta.setAttribute('content', themeColor);
    freshMeta.setAttribute('id', 'lekhix-theme-color');
    doc.head.appendChild(freshMeta);

    const colorSchemeMeta = doc.head.querySelector('meta[name="color-scheme"]');
    if (colorSchemeMeta) {
      colorSchemeMeta.setAttribute('content', isDarkMode ? 'dark' : 'light');
    }

    let appleStatusMeta = doc.head.querySelector(
      'meta[name="apple-mobile-web-app-status-bar-style"]'
    );
    if (!appleStatusMeta) {
      appleStatusMeta = doc.createElement('meta');
      appleStatusMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
      doc.head.appendChild(appleStatusMeta);
    }
    appleStatusMeta.setAttribute('content', 'black-translucent');
  }
}

function forceMobileStatusBarRepaint(isDarkMode: boolean, themeColor: string) {
  syncDocumentStatusBarColor(document, isDarkMode, themeColor);

  try {
    if (window.parent && window.parent !== window && window.parent.document) {
      syncDocumentStatusBarColor(window.parent.document, isDarkMode, themeColor);
    }
  } catch {
    // ignore cross-origin parent
  }

  try {
    if (window.top && window.top !== window && window.top.document) {
      syncDocumentStatusBarColor(window.top.document, isDarkMode, themeColor);
    }
  } catch {
    // ignore cross-origin top
  }

  try {
    void document.documentElement.offsetHeight;
    const y = window.scrollY;
    window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });
  } catch {
    // ignore
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    try {
      const saved = localStorage.getItem('theme') as Theme | null;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return saved === 'dark' || (!saved && prefersDark) ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    const isDarkMode = theme === 'dark';
    const themeColor = isDarkMode ? '#0A0A0C' : '#FAFAFA';

    forceMobileStatusBarRepaint(isDarkMode, themeColor);

    const raf1 = window.requestAnimationFrame(() => {
      forceMobileStatusBarRepaint(isDarkMode, themeColor);
      window.requestAnimationFrame(() => {
        forceMobileStatusBarRepaint(isDarkMode, themeColor);
      });
    });

    const t1 = window.setTimeout(() => {
      forceMobileStatusBarRepaint(isDarkMode, themeColor);
    }, 35);

    const t2 = window.setTimeout(() => {
      forceMobileStatusBarRepaint(isDarkMode, themeColor);
    }, 120);

    return () => {
      window.cancelAnimationFrame(raf1);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [theme]);

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    const isDarkMode = newTheme === 'dark';
    const themeColor = isDarkMode ? '#0A0A0C' : '#FAFAFA';

    forceMobileStatusBarRepaint(isDarkMode, themeColor);
    setTheme(newTheme);

    try {
      localStorage.setItem('theme', newTheme);
    } catch {
      // ignore storage errors
    }
  };

  const isDark = theme === 'dark';
  const activeBg = isDark ? '#0A0A0C' : '#FAFAFA';

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {/* Top status bar & overscroll bleed cover (keyed by theme so WebKit repaints immediately) */}
      <div
        key={`status-bleed-${theme}`}
        aria-hidden="true"
        style={{ backgroundColor: activeBg }}
        className="fixed -top-24 left-0 right-0 h-[calc(6rem+env(safe-area-inset-top,0px))] bg-[#FAFAFA] dark:bg-[#0A0A0C] z-[300] pointer-events-none"
      />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
