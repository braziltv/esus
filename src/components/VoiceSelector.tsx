import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Play, Loader2, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { GOOGLE_VOICES, PATIENT_CALL_VOICE_KEY } from './SettingsDialog';

interface VoiceSelectorProps {
  compact?: boolean;
}

// Badge de qualidade
const QualityBadge = ({ quality }: { quality: string }) => {
  const colors: Record<string, string> = {
    'ultra-hd': 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    'ultra': 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
    'premium': 'bg-green-500 text-white',
    'high': 'bg-amber-500 text-white',
    'standard': 'bg-muted text-muted-foreground',
  };
  
  const labels: Record<string, string> = {
    'ultra-hd': 'HD',
    'ultra': '★',
    'premium': 'Pro',
    'high': 'Hi',
    'standard': '',
  };
  
  if (!labels[quality]) return null;
  
  return (
    <span className={`px-1 py-0.5 text-[9px] font-bold rounded ${colors[quality] || 'bg-muted'}`}>
      {labels[quality]}
    </span>
  );
};

export function VoiceSelector({ compact = false }: VoiceSelectorProps) {
  const [selectedVoice, setSelectedVoice] = useState(() => 
    localStorage.getItem(PATIENT_CALL_VOICE_KEY) || 'pt-BR-Journey-F'
  );
  const [isTesting, setIsTesting] = useState(false);

  // Todas as vozes combinadas
  const allVoices = [...GOOGLE_VOICES.female, ...GOOGLE_VOICES.male];
  const currentVoice = allVoices.find(v => v.id === selectedVoice);
  
  // Agrupar por categoria
  const categories = ['Chirp 3 HD', 'Journey', 'Studio', 'Neural2', 'WaveNet', 'Standard'];

  useEffect(() => {
    localStorage.setItem(PATIENT_CALL_VOICE_KEY, selectedVoice);
  }, [selectedVoice]);

  const testVoice = async (voiceId: string) => {
    setIsTesting(true);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-cloud-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            text: 'Maria da Silva. Por favor, dirija-se à Triagem.',
            voiceName: voiceId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao testar voz');
      }

      const audioBuffer = await response.arrayBuffer();
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setIsTesting(false);
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        setIsTesting(false);
        toast.error('Erro ao reproduzir áudio');
      };
      
      await audio.play();
    } catch (error) {
      console.error('Erro ao testar voz:', error);
      toast.error(`Erro: ${error instanceof Error ? error.message : 'Falha no teste'}`);
      setIsTesting(false);
    }
  };

  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    toast.success(`Voz alterada para: ${allVoices.find(v => v.id === voiceId)?.name || voiceId}`);
  };

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1 text-xs"
          >
            <Mic className="w-3 h-3" />
            {currentVoice?.name?.split(' - ')[0] || 'Voz'}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 max-h-[400px] overflow-y-auto bg-card border border-border">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Voz de Chamada</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                testVoice(selectedVoice);
              }}
              disabled={isTesting}
              className="h-6 px-2 text-xs"
            >
              {isTesting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1" />
                  Testar
                </>
              )}
            </Button>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuRadioGroup value={selectedVoice} onValueChange={handleVoiceChange}>
            {categories.map(category => {
              const femaleVoices = GOOGLE_VOICES.female.filter(v => v.category === category);
              const maleVoices = GOOGLE_VOICES.male.filter(v => v.category === category);
              
              if (femaleVoices.length === 0 && maleVoices.length === 0) return null;
              
              return (
                <div key={category}>
                  <DropdownMenuLabel className="text-xs text-muted-foreground py-1">
                    {category}
                  </DropdownMenuLabel>
                  
                  {femaleVoices.length > 0 && (
                    <>
                      <div className="px-2 text-[10px] text-pink-500 uppercase">Feminino</div>
                      {femaleVoices.map(voice => (
                        <DropdownMenuRadioItem 
                          key={voice.id} 
                          value={voice.id}
                          className="cursor-pointer text-sm"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <span className="flex-1">{voice.name}</span>
                            <QualityBadge quality={voice.quality} />
                          </div>
                        </DropdownMenuRadioItem>
                      ))}
                    </>
                  )}
                  
                  {maleVoices.length > 0 && (
                    <>
                      <div className="px-2 text-[10px] text-blue-500 uppercase mt-1">Masculino</div>
                      {maleVoices.map(voice => (
                        <DropdownMenuRadioItem 
                          key={voice.id} 
                          value={voice.id}
                          className="cursor-pointer text-sm"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <span className="flex-1">{voice.name}</span>
                            <QualityBadge quality={voice.quality} />
                          </div>
                        </DropdownMenuRadioItem>
                      ))}
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                </div>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
          >
            <Mic className="w-4 h-4" />
            Voz: {currentVoice?.name || 'Selecionar'}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-72 max-h-[500px] overflow-y-auto bg-card border border-border">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Selecionar Voz de Chamada</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                testVoice(selectedVoice);
              }}
              disabled={isTesting}
              className="h-7 px-2 text-xs"
            >
              {isTesting ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Play className="w-3 h-3 mr-1" />
              )}
              Testar
            </Button>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuRadioGroup value={selectedVoice} onValueChange={handleVoiceChange}>
            {categories.map(category => {
              const femaleVoices = GOOGLE_VOICES.female.filter(v => v.category === category);
              const maleVoices = GOOGLE_VOICES.male.filter(v => v.category === category);
              
              if (femaleVoices.length === 0 && maleVoices.length === 0) return null;
              
              return (
                <div key={category}>
                  <DropdownMenuLabel className="text-xs text-muted-foreground py-1 bg-muted/50">
                    {category}
                  </DropdownMenuLabel>
                  
                  {femaleVoices.length > 0 && (
                    <>
                      <div className="px-2 py-0.5 text-[10px] text-pink-500 uppercase font-medium">Feminino</div>
                      {femaleVoices.map(voice => (
                        <DropdownMenuRadioItem 
                          key={voice.id} 
                          value={voice.id}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <span className="flex-1">{voice.name}</span>
                            <QualityBadge quality={voice.quality} />
                          </div>
                        </DropdownMenuRadioItem>
                      ))}
                    </>
                  )}
                  
                  {maleVoices.length > 0 && (
                    <>
                      <div className="px-2 py-0.5 text-[10px] text-blue-500 uppercase font-medium mt-1">Masculino</div>
                      {maleVoices.map(voice => (
                        <DropdownMenuRadioItem 
                          key={voice.id} 
                          value={voice.id}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <span className="flex-1">{voice.name}</span>
                            <QualityBadge quality={voice.quality} />
                          </div>
                        </DropdownMenuRadioItem>
                      ))}
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                </div>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
