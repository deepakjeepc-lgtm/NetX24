import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { haptic } from '../utils/haptics';

interface ThemeToggleProps {
  className?: string;
  iconClassName?: string;
}

export default function ThemeToggle({ 
  className = "p-2 rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer", 
  iconClassName = "w-5 h-5" 
}: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  const handleToggle = () => {
    haptic.light();
    toggleTheme();
  };

  return (
    <button
      onClick={handleToggle}
      className={className}
      aria-label="Toggle Dark Mode"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? <Sun className={iconClassName} strokeWidth={2} /> : <Moon className={iconClassName} strokeWidth={2} />}
    </button>
  );
}

