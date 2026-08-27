'use client';

import { useEffect, useMemo, useState } from 'react';

type Theme = 'light' | 'dark';

const transitionStyle = {
  transition: 'all .6s cubic-bezier(.69,.15,.34,1.37)',
};

function getPreferredTheme(): Theme {
  const stored = window.localStorage.getItem('recorder-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  const isDark = theme === 'dark';

  useEffect(() => {
    const preferred = getPreferredTheme();
    document.documentElement.dataset.theme = preferred;
    document.documentElement.style.colorScheme = preferred;
    setTheme(preferred);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    window.localStorage.setItem('recorder-theme', nextTheme);
    setTheme(nextTheme);
  };

  const totalCircles = 12;
  const outerCircles = useMemo(
    () => Array.from({ length: totalCircles }).map((_, index) => {
      const degrees = (index * 360) / totalCircles;
      const cx = isDark ? 50 : 50 + 24 * Math.cos((degrees * Math.PI) / 180);
      const cy = isDark ? 50 : 50 + 24 * Math.sin((degrees * Math.PI) / 180);
      const width = isDark ? 0 : 8;
      const height = isDark ? 0 : 4;
      return {
        x: cx - width / 2,
        y: cy - height / 2,
        width,
        height,
        rx: height / 2,
        ry: height / 2,
        transform: `rotate(${degrees}, ${cx}, ${cy})`,
        style: {
          ...transitionStyle,
          transitionDelay: isDark ? '0s' : `${(index * 0.2) / totalCircles}s`,
          opacity: isDark ? 0 : 1,
        },
      };
    }),
    [isDark]
  );

  return (
    <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`} title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
        <g>
          {outerCircles.map((attributes, index) => <rect fill="currentColor" key={index} {...attributes} />)}
        </g>
        <g>
          <defs>
            <mask id="themeToggleMask">
              <circle style={transitionStyle} cx="50" cy="50" r={isDark ? 26 : 15} fill="white" />
              <circle style={transitionStyle} cx={isDark ? 65 : 80} cy={isDark ? 35 : 20} r={isDark ? 25 : 5} fill="black" />
            </mask>
          </defs>
          <circle cx="50" cy="50" r="30" fill="currentColor" mask="url(#themeToggleMask)" />
        </g>
      </svg>
    </button>
  );
}
