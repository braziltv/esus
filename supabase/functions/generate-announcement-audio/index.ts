import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Voice mapping from Google voices to ElevenLabs voices
const voiceMapping: Record<string, string> = {
  // Female voices -> Alice
  'pt-BR-Chirp3-HD-Achernar': 'Xb7hH8MSUJpSbSDYk0k2',
  'pt-BR-Chirp3-HD-Leda': 'Xb7hH8MSUJpSbSDYk0k2',
  'pt-BR-Chirp3-HD-Sulafat': 'Xb7hH8MSUJpSbSDYk0k2',
  'pt-BR-Chirp3-HD-Vindemiatrix': 'Xb7hH8MSUJpSbSDYk0k2',
  'pt-BR-Chirp3-HD-Sadachbia': 'Xb7hH8MSUJpSbSDYk0k2',
  // Male voices -> Brian
  'pt-BR-Chirp3-HD-Fenrir': 'onwK4e9ZLuTAKqWW03F9',
  'pt-BR-Chirp3-HD-Orus': 'onwK4e9ZLuTAKqWW03F9',
  'pt-BR-Chirp3-HD-Puck': 'onwK4e9ZLuTAKqWW03F9',
  'pt-BR-Chirp3-HD-Alnilam': 'onwK4e9ZLuTAKqWW03F9',
  'pt-BR-Chirp3-HD-Charon': 'onwK4e9ZLuTAKqWW03F9',
};

// Generate cache key from text content
function generateCacheKey(announcementId: string): string {
  return `announcement_${announcementId}.mp3`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase configuration" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!ELEVENLABS_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Missing ElevenLabs API key" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { announcementId, text, voiceName, deleteOnly } = await req.json();

    if (!announcementId) {
      return new Response(
        JSON.stringify({ error: "Missing announcementId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cacheKey = generateCacheKey(announcementId);

    // If deleteOnly, just delete the cached audio
    if (deleteOnly) {
      console.log(`Deleting cached audio for announcement: ${announcementId}`);
      
      const { error: deleteError } = await supabase.storage
        .from('tts-cache')
        .remove([cacheKey]);
      
      if (deleteError) {
        console.error('Error deleting cached audio:', deleteError);
      }

      // Update announcement to clear cache URL
      await supabase
        .from('scheduled_announcements')
        .update({ audio_cache_url: null, audio_generated_at: null })
        .eq('id', announcementId);

      return new Response(
        JSON.stringify({ success: true, deleted: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Missing text" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating audio for announcement: ${announcementId}`);
    console.log(`Text: "${text.substring(0, 50)}..."`);

    // Map voice name to ElevenLabs voice ID
    const voiceId = voiceMapping[voiceName] || 'Xb7hH8MSUJpSbSDYk0k2'; // Default to Alice

    // Delete old cached audio first
    await supabase.storage
      .from('tts-cache')
      .remove([cacheKey]);

    // Generate new audio using ElevenLabs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          output_format: "mp3_44100_128",
          voice_settings: {
            stability: 0.38,
            similarity_boost: 0.82,
            style: 0.42,
            use_speaker_boost: true,
            speed: 0.88,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: `TTS generation failed: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    console.log(`Generated audio: ${audioBuffer.byteLength} bytes`);

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('tts-cache')
      .upload(cacheKey, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading to storage:', uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to cache audio" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('tts-cache')
      .getPublicUrl(cacheKey);

    const audioUrl = urlData.publicUrl;
    console.log(`Cached audio URL: ${audioUrl}`);

    // Update announcement with cache URL
    const { error: updateError } = await supabase
      .from('scheduled_announcements')
      .update({ 
        audio_cache_url: audioUrl,
        audio_generated_at: new Date().toISOString()
      })
      .eq('id', announcementId);

    if (updateError) {
      console.error('Error updating announcement:', updateError);
    }

    return new Response(
      JSON.stringify({ success: true, audioUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error in generate-announcement-audio:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
