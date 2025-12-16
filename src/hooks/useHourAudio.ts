import { supabase } from "@/integrations/supabase/client";

export const useHourAudio = () => {
  const getHourAudioUrl = (hour: number, minute: number): string => {
    const cacheKey = `hours/hour_${hour.toString().padStart(2, '0')}_${minute.toString().padStart(2, '0')}.mp3`;
    const { data } = supabase.storage
      .from('tts-cache')
      .getPublicUrl(cacheKey);
    return data.publicUrl;
  };

  const playHourAudio = async (hour: number, minute: number): Promise<boolean> => {
    try {
      const url = getHourAudioUrl(hour, minute);
      const audio = new Audio(url);
      audio.volume = 1.0;
      
      return new Promise((resolve) => {
        audio.onended = () => resolve(true);
        audio.onerror = () => resolve(false);
        audio.play().catch(() => resolve(false));
      });
    } catch (error) {
      console.error('Error playing hour audio:', error);
      return false;
    }
  };

  const generateHourAudios = async (
    hour: number,
    onProgress?: (current: number, total: number) => void
  ): Promise<{ success: number; failed: number; errors: string[] }> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-hour-audio`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ action: 'generate-hour', hour }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error generating hour audios:', error);
      return {
        success: 0,
        failed: 1,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  };

  const generateAllHourAudios = async (
    onProgress?: (currentHour: number, totalHours: number) => void
  ): Promise<{ success: number; failed: number; errors: string[] }> => {
    const totalResults = { success: 0, failed: 0, errors: [] as string[] };
    
    for (let hour = 0; hour < 24; hour++) {
      onProgress?.(hour, 24);
      const result = await generateHourAudios(hour);
      totalResults.success += result.success;
      totalResults.failed += result.failed;
      totalResults.errors.push(...result.errors);
    }
    
    return totalResults;
  };

  const checkHourAudioExists = async (hour: number, minute: number): Promise<boolean> => {
    try {
      const url = getHourAudioUrl(hour, minute);
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  };

  return {
    getHourAudioUrl,
    playHourAudio,
    generateHourAudios,
    generateAllHourAudios,
    checkHourAudioExists,
  };
};
