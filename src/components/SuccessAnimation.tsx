import { useEffect, useState, useRef, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface SuccessAnimationProps {
  show: boolean;
  message: string;
  onComplete?: () => void;
}

export function SuccessAnimation({ show, message, onComplete }: SuccessAnimationProps) {
  const [visible, setVisible] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playSuccessSound = useCallback(() => {
    try {
      const volume = parseFloat(localStorage.getItem('notificationVolume') || '0.3');
      if (volume === 0) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Pleasant success chord (C-E-G ascending)
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        
        gain.gain.setValueAtTime(0, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(volume * 0.3, now + i * 0.08 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);
        
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.4);
      });

      // Add a soft "shimmer" high note
      const shimmer = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      
      shimmer.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);
      
      shimmer.type = 'sine';
      shimmer.frequency.setValueAtTime(1046.5, now + 0.2); // C6
      shimmer.frequency.exponentialRampToValueAtTime(1318.5, now + 0.5); // E6
      
      shimmerGain.gain.setValueAtTime(0, now + 0.2);
      shimmerGain.gain.linearRampToValueAtTime(volume * 0.15, now + 0.25);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      
      shimmer.start(now + 0.2);
      shimmer.stop(now + 0.6);

    } catch (error) {
      console.log('Could not play success sound:', error);
    }
  }, []);

  useEffect(() => {
    if (show) {
      setVisible(true);
      playSuccessSound();
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete, playSuccessSound]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-green-500/20 animate-fade-in" />
      
      {/* Content */}
      <div className="relative flex flex-col items-center gap-4 animate-scale-in">
        {/* Animated circle */}
        <div className="relative">
          <div className="absolute inset-0 bg-green-500/30 rounded-full animate-ping" />
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/50">
            <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-white animate-bounce" style={{ animationDuration: '0.5s' }} />
          </div>
        </div>
        
        {/* Message */}
        <div className="bg-card/95 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-green-500/50">
          <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400 text-center">
            {message}
          </p>
        </div>

        {/* Confetti-like particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: '50%',
                top: '50%',
                backgroundColor: ['#22c55e', '#86efac', '#4ade80', '#16a34a'][i % 4],
                animation: `confetti-${i % 4} 1s ease-out forwards`,
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes confetti-0 {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(calc(-50% + 80px), calc(-50% - 100px)) scale(1); opacity: 0; }
        }
        @keyframes confetti-1 {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(calc(-50% - 80px), calc(-50% - 80px)) scale(1); opacity: 0; }
        }
        @keyframes confetti-2 {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(calc(-50% + 100px), calc(-50% + 40px)) scale(1); opacity: 0; }
        }
        @keyframes confetti-3 {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(calc(-50% - 100px), calc(-50% + 60px)) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
