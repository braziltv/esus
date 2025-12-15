import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId, unitName } = await req.json();

    if (!text) {
      throw new Error("Text is required");
    }

    const ELEVENLABS_API_KEY_1 = Deno.env.get("ELEVENLABS_API_KEY");
    const ELEVENLABS_API_KEY_2 = Deno.env.get("ELEVENLABS_API_KEY_2");
    const ELEVENLABS_API_KEY_3 = Deno.env.get("ELEVENLABS_API_KEY_3");
    
    // Get all available API keys with their indices
    const allKeys = [
      { key: ELEVENLABS_API_KEY_1, index: 1 },
      { key: ELEVENLABS_API_KEY_2, index: 2 },
      { key: ELEVENLABS_API_KEY_3, index: 3 },
    ].filter((item): item is { key: string; index: number } => Boolean(item.key));
    
    if (allKeys.length === 0) {
      throw new Error("No ELEVENLABS_API_KEY configured");
    }

    // Shuffle keys for random selection but keep all for retry
    const shuffledKeys = [...allKeys].sort(() => Math.random() - 0.5);
    
    console.log(`Generating TTS for: "${text}"`);

    // Use Lucas voice - male, good for Portuguese
    const selectedVoiceId = voiceId || "SVgp5d1fyFQRW1eQbwkq"; // Lucas

    let lastError: Error | null = null;
    let successKeyIndex = 0;

    // Try each key until one succeeds
    for (const { key, index } of shuffledKeys) {
      console.log(`Trying API key ${index} of ${allKeys.length} available`);
      
      try {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
          {
            method: "POST",
            headers: {
              "xi-api-key": key,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text,
              model_id: "eleven_multilingual_v2",
              output_format: "mp3_44100_128",
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.3,
                use_speaker_boost: true,
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API key ${index} failed:`, response.status, errorText);
          lastError = new Error(`ElevenLabs API error: ${response.status}`);
          continue; // Try next key
        }

        const audioBuffer = await response.arrayBuffer();
        console.log(`Audio generated successfully with key ${index}, size: ${audioBuffer.byteLength} bytes`);
        successKeyIndex = index;

        // Track API key usage in database (only on success)
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL");
          const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
          
          if (supabaseUrl && supabaseServiceKey) {
            const supabase = createClient(supabaseUrl, supabaseServiceKey);
            await supabase.from("api_key_usage").insert({
              api_key_index: successKeyIndex,
              unit_name: unitName || "Desconhecido"
            });
            console.log(`Tracked API key ${successKeyIndex} usage for unit: ${unitName || "Desconhecido"}`);
          }
        } catch (trackError) {
          console.error("Error tracking API key usage:", trackError);
        }

        return new Response(audioBuffer, {
          headers: {
            ...corsHeaders,
            "Content-Type": "audio/mpeg",
          },
        });
      } catch (fetchError) {
        console.error(`Error with API key ${index}:`, fetchError);
        lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
        continue; // Try next key
      }
    }

    // All keys failed
    throw lastError || new Error("All API keys failed");
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in elevenlabs-tts function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
