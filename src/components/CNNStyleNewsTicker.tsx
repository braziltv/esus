import { Megaphone } from 'lucide-react';

interface NewsItem {
  title: string;
  link: string;
  source: string;
}

interface CommercialPhrase {
  id: string;
  phrase_content: string;
  start_time: string;
  end_time: string;
  days_of_week: number[];
  is_active: boolean;
  display_order: number;
}

interface CNNStyleNewsTickerProps {
  newsItems: NewsItem[];
  commercialPhrases: CommercialPhrase[];
  currentTime: Date | null;
  isAnnouncing?: boolean;
}

export function CNNStyleNewsTicker({
  newsItems,
  commercialPhrases,
  currentTime,
  isAnnouncing = false,
}: CNNStyleNewsTickerProps) {
  if (newsItems.length === 0) return null;

  // Build items array with commercial phrases interleaved
  const buildItemsArray = () => {
    const creditItem = { 
      title: 'Solução Criada Por Kalebe Gomes',
      source: 'Créditos', 
      link: '' 
    };
    
    const commercialItems = commercialPhrases.map(phrase => ({
      title: phrase.phrase_content,
      source: '📢 Informativo',
      link: '',
      isCommercial: true,
    }));

    const itemsWithExtras: Array<typeof newsItems[0] & { isCommercial?: boolean }> = [];
    let commercialIndex = 0;

    newsItems.forEach((item, index) => {
      itemsWithExtras.push(item);
      
      if ((index + 1) % 5 === 0 && commercialIndex < commercialItems.length) {
        itemsWithExtras.push(commercialItems[commercialIndex]);
        commercialIndex++;
      }
      
      if ((index + 1) % 5 === 0) {
        itemsWithExtras.push(creditItem);
      }
    });
    
    while (commercialIndex < commercialItems.length) {
      itemsWithExtras.push(commercialItems[commercialIndex]);
      commercialIndex++;
    }

    return itemsWithExtras;
  };

  const items = buildItemsArray();

  // Modern badge styles for each news source
  const getSourceConfig = (source: string): { style: string; icon?: string } => {
    const configs: Record<string, { style: string; icon?: string }> = {
      '📢 Informativo': { 
        style: 'bg-gradient-to-r from-red-600 via-red-500 to-rose-500 text-white shadow-lg shadow-red-500/40 ring-1 ring-red-400/50', 
        icon: '' 
      },
      'Créditos': { 
        style: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 text-amber-950 shadow-lg shadow-amber-400/40 ring-1 ring-amber-300/50', 
        icon: '⭐' 
      },
      'G1': { 
        style: 'bg-gradient-to-br from-red-600 via-red-500 to-rose-600 text-white shadow-lg shadow-red-500/50 ring-1 ring-red-400/30', 
        icon: '🔴' 
      },
      'O Globo': { 
        style: 'bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/50 ring-1 ring-blue-400/30', 
        icon: '🌐' 
      },
      'Itatiaia': { 
        style: 'bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400 text-amber-950 shadow-lg shadow-yellow-400/50 ring-1 ring-yellow-300/50', 
        icon: '📻' 
      },
      'UOL': { 
        style: 'bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 text-white shadow-lg shadow-orange-500/50 ring-1 ring-orange-300/30', 
        icon: '🟠' 
      },
      'Folha': { 
        style: 'bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50 ring-1 ring-blue-300/30', 
        icon: '📰' 
      },
      'Estadão': { 
        style: 'bg-gradient-to-br from-slate-700 via-slate-600 to-zinc-600 text-white shadow-lg shadow-slate-600/50 ring-1 ring-slate-400/30', 
        icon: '📄' 
      },
      'CNN': { 
        style: 'bg-gradient-to-br from-red-700 via-red-600 to-rose-700 text-white shadow-lg shadow-red-600/50 ring-1 ring-red-400/30', 
        icon: '📺' 
      },
      'Band': { 
        style: 'bg-gradient-to-br from-green-600 via-emerald-500 to-teal-500 text-white shadow-lg shadow-green-500/50 ring-1 ring-green-300/30', 
        icon: '📡' 
      },
      'Terra': { 
        style: 'bg-gradient-to-br from-emerald-500 via-green-500 to-lime-500 text-white shadow-lg shadow-emerald-500/50 ring-1 ring-emerald-300/30', 
        icon: '🌍' 
      },
      'IG': { 
        style: 'bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-500 text-white shadow-lg shadow-pink-500/50 ring-1 ring-pink-300/30', 
        icon: '💗' 
      },
      'Correio': { 
        style: 'bg-gradient-to-br from-sky-600 via-cyan-500 to-teal-500 text-white shadow-lg shadow-sky-500/50 ring-1 ring-sky-300/30', 
        icon: '✉️' 
      },
      'Metrópoles': { 
        style: 'bg-gradient-to-br from-purple-600 via-violet-500 to-indigo-500 text-white shadow-lg shadow-purple-500/50 ring-1 ring-purple-300/30', 
        icon: '🏙️' 
      },
    };
    return configs[source] || { style: 'bg-gradient-to-br from-gray-600 to-slate-600 text-white shadow-lg shadow-gray-500/30', icon: '📰' };
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 shrink-0 transition-opacity duration-300 ${isAnnouncing ? 'opacity-30' : 'opacity-100'}`}>
      {/* CNN-style two-row footer */}
      <div className="flex flex-col">
        {/* Bottom ticker row - scrolling news */}
        <div className="flex items-stretch h-8 xs:h-10 sm:h-12 md:h-14 lg:h-16 xl:h-18 2xl:h-20 3xl:h-24 4k:h-28">
          {/* Scrolling News Section - Dark background like CNN */}
          <div className="flex-1 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 overflow-hidden flex items-center relative">
            {/* Top red accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] sm:h-[3px] lg:h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600" />
            
            {/* Gradient fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-4 xs:w-6 sm:w-8 md:w-12 lg:w-16 xl:w-20 bg-gradient-to-r from-gray-900 to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-4 xs:w-6 sm:w-8 md:w-12 lg:w-16 xl:w-20 bg-gradient-to-l from-gray-900 to-transparent z-10" />
            
            {/* Scrolling content */}
            <div className="animate-marquee whitespace-nowrap inline-flex py-1">
            {items.map((item, index) => {
                const config = getSourceConfig(item.source);
                return (
                  <span key={index} className="mx-2 xs:mx-3 sm:mx-4 md:mx-5 lg:mx-6 xl:mx-8 inline-flex items-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 font-semibold tracking-wide text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4k:text-4xl" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
                    <span className={`px-2 xs:px-2.5 sm:px-3 md:px-4 lg:px-5 xl:px-6 py-1 xs:py-1.5 sm:py-2 md:py-2.5 rounded-md sm:rounded-lg text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base 2xl:text-lg 3xl:text-xl 4k:text-2xl font-bold inline-flex items-center gap-1.5 sm:gap-2 transition-all duration-300 ${config.style} ${item.source === '📢 Informativo' ? 'animate-pulse' : ''}`}>
                      {item.source === '📢 Informativo' ? (
                        <>
                          <Megaphone className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 inline animate-bounce" />
                          <span className="hidden xs:inline">INFORMATIVO</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg">{config.icon}</span>
                          <span className="font-extrabold tracking-tight">{item.source}</span>
                        </>
                      )}
                    </span>
                    <span className={`drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${
                      item.source === '📢 Informativo' ? 'text-red-400 font-bold' : 
                      item.source === 'Créditos' ? 'text-amber-300' : 
                      'text-white'
                    }`}>
                      {item.title}
                    </span>
                    <span className="text-red-500 mx-2 xs:mx-3 sm:mx-4 text-xs sm:text-base md:text-lg lg:text-xl xl:text-2xl">▸</span>
                  </span>
                );
              })}
              {/* Duplicate for seamless loop */}
              {items.map((item, index) => {
                const config = getSourceConfig(item.source);
                return (
                  <span key={`dup-${index}`} className="mx-2 xs:mx-3 sm:mx-4 md:mx-5 lg:mx-6 xl:mx-8 inline-flex items-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 font-semibold tracking-wide text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4k:text-4xl" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
                    <span className={`px-2 xs:px-2.5 sm:px-3 md:px-4 lg:px-5 xl:px-6 py-1 xs:py-1.5 sm:py-2 md:py-2.5 rounded-md sm:rounded-lg text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base 2xl:text-lg 3xl:text-xl 4k:text-2xl font-bold inline-flex items-center gap-1.5 sm:gap-2 transition-all duration-300 ${config.style} ${item.source === '📢 Informativo' ? 'animate-pulse' : ''}`}>
                      {item.source === '📢 Informativo' ? (
                        <>
                          <Megaphone className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 inline animate-bounce" />
                          <span className="hidden xs:inline">INFORMATIVO</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg">{config.icon}</span>
                          <span className="font-extrabold tracking-tight">{item.source}</span>
                        </>
                      )}
                    </span>
                    <span className={`drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${
                      item.source === '📢 Informativo' ? 'text-red-400 font-bold' : 
                      item.source === 'Créditos' ? 'text-amber-300' : 
                      'text-white'
                    }`}>
                      {item.title}
                    </span>
                    <span className="text-red-500 mx-2 xs:mx-3 sm:mx-4 text-xs sm:text-base md:text-lg lg:text-xl xl:text-2xl">▸</span>
                  </span>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
