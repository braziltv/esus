import { useMemo } from 'react';
import { Lightbulb, Quote } from 'lucide-react';

const QUOTES = [
  {
    quote: "Só sei que nada sei.",
    author: "Sócrates (c. 399 a.C.)",
    insight: "Reconhecer sua própria ignorância é o primeiro passo para aprender.",
    bgColor: "from-emerald-600 to-emerald-800",
    emoji: "🗣️"
  },
  {
    quote: "Somos aquilo que fazemos repetidamente.",
    author: "Aristóteles (c. 350 a.C.)",
    insight: "Bons hábitos diários constroem caráter e excelência.",
    bgColor: "from-blue-600 to-blue-800",
    emoji: "🔄"
  },
  {
    quote: "A felicidade depende de nós mesmos.",
    author: "Aristóteles (c. 350 a.C.)",
    insight: "Alegria vem das escolhas e atitudes, não do que acontece fora.",
    bgColor: "from-orange-500 to-orange-700",
    emoji: "😊"
  },
  {
    quote: "Aquele que tem um porquê enfrenta qualquer como.",
    author: "Friedrich Nietzsche (1888)",
    insight: "Ter um propósito dá força para superar qualquer dificuldade.",
    bgColor: "from-purple-600 to-purple-800",
    emoji: "💪"
  },
  {
    quote: "Penso, logo existo.",
    author: "René Descartes (1637)",
    insight: "Pensar é a prova de nossa existência e consciência.",
    bgColor: "from-indigo-600 to-indigo-800",
    emoji: "🧠"
  },
  {
    quote: "A imaginação é mais importante que o conhecimento.",
    author: "Albert Einstein (c. 1929)",
    insight: "Criar novas ideias é mais poderoso do que apenas acumular informações.",
    bgColor: "from-red-500 to-red-700",
    emoji: "✨"
  },
  {
    quote: "No meio da dificuldade encontra-se a oportunidade.",
    author: "Albert Einstein (c. 1940)",
    insight: "Problemas podem ser portas para aprendizado e crescimento.",
    bgColor: "from-violet-600 to-violet-800",
    emoji: "🚀"
  },
  {
    quote: "Insanidade é fazer sempre a mesma coisa e esperar resultados diferentes.",
    author: "Atribuída a Albert Einstein (séc. XX)",
    insight: "Para mudar o resultado, é preciso mudar a abordagem.",
    bgColor: "from-amber-500 to-amber-700",
    emoji: "🔀"
  },
  {
    quote: "Sempre parece impossível até que seja feito.",
    author: "Nelson Mandela (c. 2001)",
    insight: "Grandes conquistas parecem inalcançáveis antes de acontecerem.",
    bgColor: "from-teal-600 to-teal-800",
    emoji: "🏆"
  },
  {
    quote: "A pressa é inimiga da perfeição.",
    author: "Provérbio clássico",
    insight: "Qualidade exige tempo e atenção aos detalhes.",
    bgColor: "from-fuchsia-600 to-fuchsia-800",
    emoji: "⏳"
  },
  {
    quote: "Aquele que vence a si mesmo é o mais poderoso.",
    author: "Lao-Tsé (c. 600 a.C.)",
    insight: "O maior domínio é controlar seus próprios impulsos.",
    bgColor: "from-cyan-600 to-cyan-800",
    emoji: "🎯"
  },
  {
    quote: "Quem não arrisca, não petisca.",
    author: "Provérbio popular",
    insight: "Sem coragem para tentar, não há recompensas.",
    bgColor: "from-rose-500 to-rose-700",
    emoji: "🎲"
  },
  {
    quote: "O futuro pertence àqueles que acreditam em seus sonhos.",
    author: "Eleanor Roosevelt (c. 1940)",
    insight: "Acreditar e agir transforma o futuro em realidade.",
    bgColor: "from-sky-600 to-sky-800",
    emoji: "🌟"
  },
  {
    quote: "Se você pode sonhar, você pode fazer.",
    author: "Walt Disney (c. 1950)",
    insight: "Todo grande feito começa com uma visão e vontade de realizá-la.",
    bgColor: "from-lime-600 to-lime-800",
    emoji: "💭"
  },
  {
    quote: "A mente que se abre a uma nova ideia jamais volta ao seu tamanho original.",
    author: "Oliver Wendell Holmes (1858)",
    insight: "Aprender muda permanentemente a forma de pensar.",
    bgColor: "from-pink-600 to-pink-800",
    emoji: "📖"
  },
  {
    quote: "Não é o mais forte que sobrevive, mas o que melhor se adapta.",
    author: "Charles Darwin (1859)",
    insight: "Flexibilidade e adaptação garantem sobrevivência e sucesso.",
    bgColor: "from-yellow-500 to-yellow-700",
    emoji: "🦋"
  }
];

function getDailyQuoteIndex(): number {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return seed % QUOTES.length;
}

export function DailyQuoteCard() {
  const dailyQuote = useMemo(() => {
    const index = getDailyQuoteIndex();
    return QUOTES[index];
  }, []);

  return (
    <div 
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${dailyQuote.bgColor} p-4 shadow-lg animate-fade-in`}
      style={{ maxWidth: '320px' }}
    >
      {/* Decorative elements */}
      <div className="absolute top-2 right-2 text-white/20 text-4xl">
        {dailyQuote.emoji}
      </div>
      <div className="absolute -bottom-2 -left-2 text-white/10 text-6xl rotate-12">
        <Lightbulb />
      </div>
      
      {/* Quote */}
      <div className="relative z-10">
        <div className="flex items-start gap-1 mb-2">
          <Quote className="w-4 h-4 text-white/70 flex-shrink-0 mt-1" />
          <p className="text-white font-semibold text-sm leading-tight">
            {dailyQuote.quote}
          </p>
        </div>
        
        {/* Author */}
        <p className="text-white/80 text-xs mb-2 pl-5">
          — {dailyQuote.author}
        </p>
        
        {/* Insight */}
        <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-2 py-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-yellow-300 flex-shrink-0" />
          <p className="text-white/90 text-xs leading-tight">
            {dailyQuote.insight}
          </p>
        </div>
      </div>
      
      {/* Daily badge */}
      <div className="absolute top-2 left-2 bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5">
        <span className="text-white text-[10px] font-medium">✨ Frase do Dia</span>
      </div>
    </div>
  );
}
