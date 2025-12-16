import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface ElapsedTimeDisplayProps {
  startTime: Date | string;
  className?: string;
}

export function ElapsedTimeDisplay({ startTime, className = '' }: ElapsedTimeDisplayProps) {
  const [elapsed, setElapsed] = useState('');
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    const calculateElapsed = () => {
      const start = new Date(startTime).getTime();
      const now = Date.now();
      const diffMs = now - start;
      
      const minutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      setElapsedMinutes(minutes);
      
      if (hours > 0) {
        return `${hours}h ${remainingMinutes}min`;
      }
      return `${minutes}min`;
    };

    setElapsed(calculateElapsed());
    
    const interval = setInterval(() => {
      setElapsed(calculateElapsed());
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [startTime]);

  // Determine animation class based on elapsed time
  // < 20 min: solid red with white text (no animation)
  // >= 20 min: blinking animation to call attention
  const getStyleClasses = () => {
    if (elapsedMinutes >= 20) {
      return 'animate-pulse-red-white'; // Blinking after 20 minutes
    }
    return 'bg-red-600 text-white'; // Solid red with white text
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${getStyleClasses()} ${className}`}>
      <Clock className="w-3 h-3" />
      {elapsed}
    </span>
  );
}
