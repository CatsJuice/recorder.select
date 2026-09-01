'use client';

type Theme = 'light' | 'dark';

export function ThemeToggle() {
  const toggleTheme = () => {
    const currentTheme: Theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    const nextTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    window.localStorage.setItem('recorder-theme', nextTheme);
  };

  const rays = Array.from({ length: 12 }, (_, index) => {
    const degrees = index * 30;
    const cx = 50 + 24 * Math.cos((degrees * Math.PI) / 180);
    const cy = 50 + 24 * Math.sin((degrees * Math.PI) / 180);
    return <rect key={index} x={cx - 4} y={cy - 2} width="8" height="4" rx="2" transform={`rotate(${degrees}, ${cx}, ${cy})`} />;
  });

  return (
    <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Toggle color theme" title="Toggle color theme">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
        <g className="theme-glyph theme-glyph-sun" fill="currentColor">
          {rays}
          <circle cx="50" cy="50" r="15" />
        </g>
        <g className="theme-glyph theme-glyph-moon">
          <defs>
            <mask id="themeToggleMask">
              <circle cx="50" cy="50" r="26" fill="white" />
              <circle cx="65" cy="35" r="25" fill="black" />
            </mask>
          </defs>
          <circle cx="50" cy="50" r="30" fill="currentColor" mask="url(#themeToggleMask)" />
        </g>
      </svg>
    </button>
  );
}
