import React from 'react';

interface NoteNestLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  subtitle?: string;
  variant?: 'default' | 'light' | 'cream-card';
  className?: string;
}

export const NoteNestLogo: React.FC<NoteNestLogoProps> = ({
  size = 'md',
  showWordmark = true,
  subtitle,
  variant = 'default',
  className = '',
}) => {
  const iconDimensions = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }[size];

  const wordmarkClasses = {
    xs: 'text-base',
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }[size];

  const textColor = variant === 'light' ? 'text-white' : 'text-[#13293D]';
  const subtitleColor = variant === 'light' ? 'text-blue-100/85' : 'text-[#64748B]';

  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${
        variant === 'cream-card'
          ? 'bg-[#FDF8EE] px-4 py-2.5 rounded-2xl border border-[#F2E8D5] shadow-xs'
          : ''
      } ${className}`}
    >
      {/* Exact Vector Reproduction of NoteNest Logo.jpeg Icon Mark */}
      <div className={`${iconDimensions} shrink-0 relative flex items-center justify-center`}>
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-2xs"
          aria-label="NoteNest Logo"
        >
          <defs>
            <linearGradient
              id="notenest-mint-fold"
              x1="34"
              y1="38"
              x2="64"
              y2="98"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#E6F4EC" />
              <stop offset="45%" stopColor="#B5DEC9" />
              <stop offset="100%" stopColor="#8CC6AF" />
            </linearGradient>
            <linearGradient
              id="notenest-coral-nest"
              x1="45"
              y1="60"
              x2="78"
              y2="106"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#F27856" />
              <stop offset="100%" stopColor="#EA6342" />
            </linearGradient>
          </defs>

          {/* Rounded Cream Tile Background */}
          <rect x="4" y="4" width="112" height="112" rx="22" fill="#FDF8EE" />

          {/* Right Sage Green Pillar of the N */}
          <path
            d="M74 12H92C99.732 12 106 18.268 106 26V94C106 101.732 99.732 108 92 108H84C87.5 104.5 89 99.5 89 93V68C89 58.5 84.5 50.5 74 39V12Z"
            fill="#93CBB4"
          />

          {/* Inner Left Soft Mint Fold under Diagonal */}
          <path
            d="M35 38L61 65C66.5 70.8 65.5 79.5 59 86.5C51.5 94.5 40 102.5 31 107.5C33.8 103.5 35 98.5 35 92V38Z"
            fill="url(#notenest-mint-fold)"
          />

          {/* Bottom Coral/Terracotta Nest Triangle */}
          <path
            d="M36 108C49 99 61.5 88.5 66.5 79.5C68.8 75.3 69.2 70.5 67.5 65.5L83.5 95C86.8 101 82.5 108 75.5 108H36Z"
            fill="url(#notenest-coral-nest)"
          />

          {/* Deep Navy Left Pillar + Diagonal Arm of the N */}
          <path
            d="M14 26C14 18.268 20.268 12 28 12H45.5C48.5 12 51.3 13.4 53.2 15.7L80.5 49C84.8 54.2 84.1 61.9 78.9 66.2C73.7 70.5 66 69.8 61.7 64.6L38 36V96C38 102.627 32.627 108 26 108C19.373 108 14 102.627 14 96V26Z"
            fill="#13293D"
          />
        </svg>
      </div>

      {showWordmark && (
        <div className="flex flex-col justify-center">
          <span
            className={`${wordmarkClasses} font-extrabold ${textColor} font-display tracking-tight leading-none`}
          >
            NoteNest
          </span>
          {subtitle && (
            <span className={`text-[11px] font-medium ${subtitleColor} mt-1 leading-tight`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
