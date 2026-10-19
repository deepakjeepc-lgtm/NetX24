import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { haptic } from '../utils/haptics';

interface ThemeToggleProps {
  className?: string;
  iconClassName?: string;
}

export default function ThemeToggle({
  className = 'p-2 text-[#111111] dark:text-[#F5F5F7] hover:opacity-65 transition-opacity cursor-pointer',
  iconClassName = 'w-4 h-4',
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
      aria-label="Toggle Dark or Light Theme"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? (
        <Sun className={iconClassName} strokeWidth={1.75} />
      ) : (
        <Moon className={iconClassName} strokeWidth={1.75} />
      )}
    </button>
  );
}
