interface LogoProps {
  className?: string;
}

export default function Logo({ className = 'w-8 h-8' }: LogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="logoGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#5b7bfa" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#logoGradient)" />
      <path
        d="M8 12L16 8L24 12V20L16 24L8 20V12Z"
        fill="white"
        fillOpacity="0.9"
      />
      <path
        d="M16 8V24M8 12L24 20M24 12L8 20"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="3" fill="url(#logoGradient)" />
    </svg>
  );
}
