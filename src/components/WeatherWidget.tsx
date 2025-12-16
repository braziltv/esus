import { useEffect, useState } from 'react';
import { Cloud, Droplets, Sun, CloudRain, CloudSnow, CloudLightning, Wind } from 'lucide-react';

interface WeatherData {
  current: {
    temp: number;
    humidity: number;
    description: string;
  };
  forecast: Array<{
    date: string;
    dayName: string;
    maxTemp: number;
    minTemp: number;
    description: string;
  }>;
  city: string;
}

function getWeatherIcon(description: string) {
  const desc = description.toLowerCase();
  const iconClass = 'w-4 h-4';
  
  if (desc.includes('sunny') || desc.includes('clear') || desc.includes('sol') || desc.includes('limpo')) 
    return <Sun className={`${iconClass} text-yellow-400`} />;
  if (desc.includes('rain') || desc.includes('shower') || desc.includes('chuva')) 
    return <CloudRain className={`${iconClass} text-blue-400`} />;
  if (desc.includes('thunder') || desc.includes('storm') || desc.includes('trovoada')) 
    return <CloudLightning className={`${iconClass} text-purple-400`} />;
  if (desc.includes('snow') || desc.includes('neve')) 
    return <CloudSnow className={`${iconClass} text-white`} />;
  if (desc.includes('fog') || desc.includes('mist') || desc.includes('neblina') || desc.includes('nevoeiro')) 
    return <Wind className={`${iconClass} text-slate-400`} />;
  
  return <Cloud className={`${iconClass} text-slate-300`} />;
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          'https://wttr.in/Paineiras,Minas+Gerais,Brazil?format=j1&lang=pt'
        );
        
        if (!response.ok) throw new Error('Failed to fetch weather');
        
        const data = await response.json();
        
        const current = data.current_condition[0];
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        const forecast = data.weather.slice(0, 3).map((day: any, index: number) => {
          const date = new Date(day.date);
          return {
            date: day.date,
            dayName: index === 0 ? 'Hj' : index === 1 ? 'Am' : days[date.getDay()],
            maxTemp: parseInt(day.maxtempC),
            minTemp: parseInt(day.mintempC),
            description: day.hourly[4]?.lang_pt?.[0]?.value || day.hourly[0]?.weatherDesc[0]?.value || '',
          };
        });

        setWeather({
          current: {
            temp: parseInt(current.temp_C),
            humidity: parseInt(current.humidity),
            description: current.lang_pt?.[0]?.value || current.weatherDesc[0]?.value || '',
          },
          forecast,
          city: 'Paineiras',
        });
        setError(null);
      } catch (err) {
        console.error('Weather fetch error:', err);
        setError('Indisponível');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/20">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-white/70 animate-pulse" />
          <span className="text-white/80 text-xs">Carregando...</span>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/20">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-white/50" />
          <span className="text-white/60 text-xs">{error || 'Indisponível'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/20">
      <div className="flex items-center gap-3">
        {/* Current */}
        {getWeatherIcon(weather.current.description)}
        <span className="text-white font-bold text-sm">{weather.current.temp}°</span>
        
        <Droplets className="w-3 h-3 text-cyan-300" />
        <span className="text-white/80 text-xs">{weather.current.humidity}%</span>
        
        <div className="w-px h-4 bg-white/20" />
        
        {/* 3-day forecast */}
        {weather.forecast.map((day, index) => (
          <div key={index} className="flex items-center gap-1">
            {getWeatherIcon(day.description)}
            <span className="text-white/60 text-xs">{day.dayName}</span>
            <span className="text-white text-xs font-medium">{day.maxTemp}°/{day.minTemp}°</span>
          </div>
        ))}
        
        <div className="w-px h-4 bg-white/20" />
        <span className="text-white/70 text-xs">Paineiras</span>
      </div>
    </div>
  );
}
