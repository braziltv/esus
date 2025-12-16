import { useEffect, useState } from 'react';
import { Cloud, Droplets, Sun, CloudRain, CloudSnow, CloudLightning, Wind, CloudSun } from 'lucide-react';

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

function getWeatherIcon(description: string, size: 'sm' | 'lg' = 'sm') {
  const desc = description.toLowerCase();
  const iconClass = size === 'lg' ? 'w-10 h-10' : 'w-5 h-5';
  
  if (desc.includes('sunny') || desc.includes('clear') || desc.includes('sol') || desc.includes('limpo')) 
    return <Sun className={`${iconClass} text-yellow-400`} />;
  if (desc.includes('partly') || desc.includes('parcialmente')) 
    return <CloudSun className={`${iconClass} text-yellow-300`} />;
  if (desc.includes('rain') || desc.includes('shower') || desc.includes('chuva')) 
    return <CloudRain className={`${iconClass} text-blue-400`} />;
  if (desc.includes('thunder') || desc.includes('storm') || desc.includes('trovoada')) 
    return <CloudLightning className={`${iconClass} text-purple-400`} />;
  if (desc.includes('snow') || desc.includes('neve')) 
    return <CloudSnow className={`${iconClass} text-white`} />;
  if (desc.includes('fog') || desc.includes('mist') || desc.includes('neblina') || desc.includes('nevoeiro')) 
    return <Wind className={`${iconClass} text-slate-400`} />;
  if (desc.includes('cloud') || desc.includes('nublado') || desc.includes('encoberto')) 
    return <Cloud className={`${iconClass} text-slate-300`} />;
  
  return <CloudSun className={`${iconClass} text-yellow-300`} />;
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
        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

        const forecast = data.weather.slice(0, 2).map((day: any, index: number) => {
          const date = new Date(day.date);
          return {
            date: day.date,
            dayName: index === 0 ? 'HOJE' : dayNames[date.getDay()].toUpperCase(),
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
      <div className="bg-gradient-to-r from-teal-600/90 to-teal-500/90 backdrop-blur-md rounded-xl px-4 py-3 border border-teal-400/30 shadow-lg">
        <div className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-white/70 animate-pulse" />
          <span className="text-white/80 text-sm">Carregando...</span>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-gradient-to-r from-teal-600/90 to-teal-500/90 backdrop-blur-md rounded-xl px-4 py-3 border border-teal-400/30 shadow-lg">
        <div className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-white/50" />
          <span className="text-white/60 text-sm">{error || 'Indisponível'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-teal-700/95 to-teal-600/95 backdrop-blur-md rounded-xl border border-teal-400/30 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-teal-500/50 px-3 py-1 text-center border-b border-teal-400/30">
        <p className="text-white font-bold text-xs tracking-wider">CLIMA TEMPO</p>
        <p className="text-teal-100 text-[10px] font-medium">{weather.city.toUpperCase()}</p>
      </div>
      
      <div className="flex items-stretch">
        {/* Left: Current weather */}
        <div className="px-3 py-2 flex items-center gap-2 border-r border-teal-400/30">
          <div className="text-center">
            <p className="text-teal-200 text-[9px] font-semibold mb-0.5">AGORA</p>
            <div className="flex items-center gap-1">
              {getWeatherIcon(weather.current.description, 'lg')}
              <span className="text-white font-black text-2xl leading-none">{weather.current.temp}°</span>
              <span className="text-teal-200 text-xs">c</span>
            </div>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <Droplets className="w-3 h-3 text-cyan-300" />
              <span className="text-teal-100 text-[9px]">{weather.current.humidity}%</span>
            </div>
          </div>
        </div>
        
        {/* Right: Forecast cards */}
        <div className="flex flex-col gap-1 p-1.5">
          {weather.forecast.map((day, index) => (
            <div 
              key={index} 
              className="bg-emerald-500/80 rounded-md px-2 py-1 flex items-center gap-2 min-w-[100px]"
            >
              <div className="flex-1">
                <p className="text-white font-bold text-[9px] leading-tight">{day.dayName}</p>
                <div className="flex items-center gap-1 text-[8px] text-white/90">
                  <span className="text-emerald-200">MIN</span>
                  <span className="font-semibold">{day.minTemp}°</span>
                </div>
                <div className="flex items-center gap-1 text-[8px] text-white/90">
                  <span className="text-emerald-200">MAX</span>
                  <span className="font-semibold">{day.maxTemp}°</span>
                </div>
              </div>
              <div className="shrink-0">
                {getWeatherIcon(day.description, 'sm')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
