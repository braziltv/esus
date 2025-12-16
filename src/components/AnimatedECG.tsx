import { useEffect, useState } from 'react';

interface AnimatedECGProps {
  className?: string;
  size?: number;
}

export function AnimatedECG({ className = '', size = 24 }: AnimatedECGProps) {
  const [dashOffset, setDashOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDashOffset(prev => (prev - 2) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Scale factor based on size
  const scale = size / 100;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Glow filter */}
        <filter id="ecg-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Main path: dot -> line -> ECG wave -> heart */}
      <g filter="url(#ecg-glow)">
        {/* Starting dot */}
        <circle
          cx="8"
          cy="65"
          r="4"
          fill="#ef4444"
          className="animate-pulse"
        />
        
        {/* ECG line path that connects to heart */}
        <path
          d="M 12 65 
             L 25 65 
             L 28 65 
             L 32 75 
             L 36 55 
             L 40 65 
             L 44 65
             L 48 65
             L 52 45
             C 52 25, 75 25, 75 45
             C 75 55, 63 70, 52 80
             C 41 70, 29 55, 29 45
             C 29 35, 40 30, 52 45"
          fill="none"
          stroke="#ef4444"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="8 4"
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 0.05s linear',
          }}
        />

        {/* Heart shape filled with slight transparency */}
        <path
          d="M 52 45
             C 52 25, 75 25, 75 45
             C 75 55, 63 70, 52 80
             C 41 70, 29 55, 29 45
             C 29 35, 40 30, 52 45"
          fill="rgba(239, 68, 68, 0.15)"
          stroke="none"
        />
      </g>
    </svg>
  );
}
