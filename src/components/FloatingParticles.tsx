import { useMemo } from 'react';

interface Particle {
  id: number;
  size: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
  opacity: number;
}

interface FloatingParticlesProps {
  activeCallType?: 'triage' | 'doctor' | null;
}

export function FloatingParticles({ activeCallType }: FloatingParticlesProps) {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      size: Math.random() * 8 + 3,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * -20,
      opacity: Math.random() * 0.5 + 0.3,
    }));
  }, []);

  // Color schemes based on call type
  const getParticleColor = (index: number) => {
    if (activeCallType === 'triage') {
      const triageColors = [
        'rgba(6, 182, 212, 0.6)',   // cyan-500
        'rgba(14, 165, 233, 0.5)',  // sky-500
        'rgba(59, 130, 246, 0.5)',  // blue-500
        'rgba(99, 102, 241, 0.4)',  // indigo-500
        'rgba(139, 92, 246, 0.3)',  // violet-500
      ];
      return triageColors[index % triageColors.length];
    } else if (activeCallType === 'doctor') {
      const doctorColors = [
        'rgba(16, 185, 129, 0.6)',  // emerald-500
        'rgba(34, 197, 94, 0.5)',   // green-500
        'rgba(52, 211, 153, 0.5)',  // emerald-400
        'rgba(74, 222, 128, 0.4)',  // green-400
        'rgba(132, 204, 22, 0.3)', // lime-500
      ];
      return doctorColors[index % doctorColors.length];
    } else {
      // Default neutral colors
      const defaultColors = [
        'rgba(6, 182, 212, 0.35)',   // cyan
        'rgba(16, 185, 129, 0.35)',  // emerald
        'rgba(139, 92, 246, 0.25)',  // violet
        'rgba(59, 130, 246, 0.25)',  // blue
        'rgba(236, 72, 153, 0.2)',   // pink
      ];
      return defaultColors[index % defaultColors.length];
    }
  };

  const getOrbColor = () => {
    if (activeCallType === 'triage') {
      return 'rgba(6, 182, 212, 0.25)';
    } else if (activeCallType === 'doctor') {
      return 'rgba(16, 185, 129, 0.25)';
    }
    return 'rgba(6, 182, 212, 0.12)';
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle, index) => {
        const color = getParticleColor(index);
        return (
          <div
            key={particle.id}
            className={`absolute rounded-full animate-float-particle transition-all duration-1000 ${
              activeCallType ? 'scale-125' : 'scale-100'
            }`}
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
              boxShadow: `0 0 ${particle.size * 3}px ${color}`,
              animationDuration: activeCallType ? `${particle.duration * 0.6}s` : `${particle.duration}s`,
              animationDelay: `${particle.delay}s`,
              opacity: activeCallType ? particle.opacity * 1.5 : particle.opacity,
            }}
          />
        );
      })}
      
      {/* Larger glowing orbs */}
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={`orb-${i}`}
          className={`absolute rounded-full animate-float-orb transition-all duration-1000 ${
            activeCallType ? 'scale-150' : 'scale-100'
          }`}
          style={{
            width: `${25 + i * 12}px`,
            height: `${25 + i * 12}px`,
            left: `${8 + i * 18}%`,
            top: `${15 + (i % 3) * 30}%`,
            background: `radial-gradient(circle, ${getOrbColor()} 0%, transparent 70%)`,
            filter: 'blur(10px)',
            animationDuration: activeCallType ? `${(20 + i * 4) * 0.7}s` : `${25 + i * 5}s`,
            animationDelay: `${-i * 3}s`,
          }}
        />
      ))}

      {/* Extra burst particles during active call */}
      {activeCallType && (
        <>
          {Array.from({ length: 15 }, (_, i) => {
            const burstColor = activeCallType === 'triage' 
              ? 'rgba(6, 182, 212, 0.7)' 
              : 'rgba(16, 185, 129, 0.7)';
            return (
              <div
                key={`burst-${i}`}
                className="absolute rounded-full animate-float-particle"
                style={{
                  width: `${4 + Math.random() * 6}px`,
                  height: `${4 + Math.random() * 6}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: `radial-gradient(circle, ${burstColor} 0%, transparent 60%)`,
                  boxShadow: `0 0 20px ${burstColor}`,
                  animationDuration: `${8 + Math.random() * 8}s`,
                  animationDelay: `${-Math.random() * 5}s`,
                  opacity: 0.8,
                }}
              />
            );
          })}
        </>
      )}
    </div>
  );
}
