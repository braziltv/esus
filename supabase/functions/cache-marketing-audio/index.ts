import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chirp 3 HD Kore voice for marketing announcements
const MARKETING_VOICE = 'pt-BR-Chirp3-HD-Kore';

// ========== Google Cloud Auth Functions ==========
function base64UrlEncode(data: string | Uint8Array): string {
  const base64 = typeof data === 'string' 
    ? btoa(data) 
    : btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '');
  
  const binaryDer = base64Decode(pemContents);
  const keyBuffer = new ArrayBuffer(binaryDer.length);
  const keyView = new Uint8Array(keyBuffer);
  keyView.set(binaryDer);
  
  return await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

async function sign(data: string, privateKey: CryptoKey): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    encoder.encode(data)
  );
  return new Uint8Array(signatureBuffer);
}

async function createJWT(credentials: any): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: credentials.token_uri,
    iat: now,
    exp: now + 3600
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const privateKey = await importPrivateKey(credentials.private_key);
  const signature = await sign(signatureInput, privateKey);
  const encodedSignature = base64UrlEncode(signature);

  return `${signatureInput}.${encodedSignature}`;
}

async function getAccessToken(credentials: any): Promise<string> {
  const jwt = await createJWT(credentials);
  
  const response = await fetch(credentials.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[cache-marketing-audio] Error getting access token:', error);
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

// ========== TTS Generation ==========
async function generateTTSAudio(text: string, accessToken: string): Promise<Uint8Array> {
  const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: { text },
      voice: {
        languageCode: 'pt-BR',
        name: MARKETING_VOICE,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0,
        volumeGainDb: 0
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[cache-marketing-audio] TTS API error:', error);
    throw new Error(`TTS error: ${response.status}`);
  }

  const data = await response.json();
  return base64Decode(data.audioContent);
}

// ========== Hash Function ==========
async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, announcementId, text } = body;

    // Health check
    if (body.healthCheck === true) {
      return new Response(
        JSON.stringify({ 
          status: 'healthy', 
          service: 'cache-marketing-audio',
          voice: MARKETING_VOICE,
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ========== Action: Generate cache for a specific announcement ==========
    if (action === 'generate-cache' && announcementId) {
      console.log(`[cache-marketing-audio] Generating cache for announcement ${announcementId}`);
      
      // Get announcement
      const { data: announcement, error: fetchError } = await supabase
        .from('scheduled_announcements')
        .select('*')
        .eq('id', announcementId)
        .single();

      if (fetchError || !announcement) {
        throw new Error(`Announcement not found: ${announcementId}`);
      }

      // Get credentials
      const credentialsJson = Deno.env.get('GOOGLE_CLOUD_CREDENTIALS');
      if (!credentialsJson) {
        throw new Error('GOOGLE_CLOUD_CREDENTIALS not configured');
      }
      const credentials = JSON.parse(credentialsJson);
      const accessToken = await getAccessToken(credentials);

      // Generate audio
      const audioBytes = await generateTTSAudio(announcement.text_content, accessToken);
      const hash = await hashText(announcement.text_content);
      const fileName = `marketing/announcement_${announcementId}_${hash}.mp3`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('tts-cache')
        .upload(fileName, audioBytes, {
          contentType: 'audio/mpeg',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('tts-cache')
        .getPublicUrl(fileName);

      // Update announcement with cache URL
      const { error: updateError } = await supabase
        .from('scheduled_announcements')
        .update({
          audio_cache_url: urlData.publicUrl,
          audio_generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', announcementId);

      if (updateError) {
        throw new Error(`Update failed: ${updateError.message}`);
      }

      console.log(`[cache-marketing-audio] Cache generated: ${fileName}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          cacheUrl: urlData.publicUrl,
          voice: MARKETING_VOICE
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== Action: Generate cache from text directly ==========
    if (action === 'generate-from-text' && text) {
      console.log(`[cache-marketing-audio] Generating audio for text: "${text.substring(0, 50)}..."`);
      
      const credentialsJson = Deno.env.get('GOOGLE_CLOUD_CREDENTIALS');
      if (!credentialsJson) {
        throw new Error('GOOGLE_CLOUD_CREDENTIALS not configured');
      }
      const credentials = JSON.parse(credentialsJson);
      const accessToken = await getAccessToken(credentials);

      const audioBytes = await generateTTSAudio(text, accessToken);
      
      // Return audio as binary
      const audioBuffer = new ArrayBuffer(audioBytes.length);
      const audioView = new Uint8Array(audioBuffer);
      audioView.set(audioBytes);

      return new Response(audioBuffer, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'audio/mpeg'
        }
      });
    }

    // ========== Action: Cleanup expired announcements ==========
    if (action === 'cleanup-expired') {
      console.log('[cache-marketing-audio] Starting cleanup of expired announcements...');
      
      const today = new Date().toISOString().split('T')[0];
      
      // Find expired announcements with cached audio
      const { data: expiredAnnouncements, error: fetchError } = await supabase
        .from('scheduled_announcements')
        .select('id, audio_cache_url, title')
        .lt('valid_until', today)
        .not('audio_cache_url', 'is', null);

      if (fetchError) {
        throw new Error(`Failed to fetch expired announcements: ${fetchError.message}`);
      }

      let deletedFiles = 0;
      let deletedRecords = 0;
      const errors: string[] = [];

      for (const announcement of expiredAnnouncements || []) {
        try {
          // Extract file path from URL
          if (announcement.audio_cache_url) {
            const urlParts = announcement.audio_cache_url.split('/tts-cache/');
            if (urlParts.length > 1) {
              const filePath = urlParts[1];
              const { error: deleteError } = await supabase.storage
                .from('tts-cache')
                .remove([filePath]);
              
              if (!deleteError) {
                deletedFiles++;
                console.log(`[cache-marketing-audio] Deleted file: ${filePath}`);
              }
            }
          }

          // Delete the announcement record
          const { error: deleteRecordError } = await supabase
            .from('scheduled_announcements')
            .delete()
            .eq('id', announcement.id);

          if (!deleteRecordError) {
            deletedRecords++;
            console.log(`[cache-marketing-audio] Deleted announcement: ${announcement.title}`);
          }
        } catch (err) {
          errors.push(`Error processing ${announcement.id}: ${err}`);
        }
      }

      console.log(`[cache-marketing-audio] Cleanup complete: ${deletedFiles} files, ${deletedRecords} records deleted`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          deletedFiles,
          deletedRecords,
          errors: errors.length > 0 ? errors : undefined
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== Action: Regenerate all caches ==========
    if (action === 'regenerate-all') {
      console.log('[cache-marketing-audio] Regenerating all announcement caches...');
      
      const { data: announcements, error: fetchError } = await supabase
        .from('scheduled_announcements')
        .select('id, text_content, title')
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString().split('T')[0]);

      if (fetchError) {
        throw new Error(`Failed to fetch announcements: ${fetchError.message}`);
      }

      const credentialsJson = Deno.env.get('GOOGLE_CLOUD_CREDENTIALS');
      if (!credentialsJson) {
        throw new Error('GOOGLE_CLOUD_CREDENTIALS not configured');
      }
      const credentials = JSON.parse(credentialsJson);
      const accessToken = await getAccessToken(credentials);

      let generated = 0;
      const errors: string[] = [];

      for (const announcement of announcements || []) {
        try {
          const audioBytes = await generateTTSAudio(announcement.text_content, accessToken);
          const hash = await hashText(announcement.text_content);
          const fileName = `marketing/announcement_${announcement.id}_${hash}.mp3`;

          const { error: uploadError } = await supabase.storage
            .from('tts-cache')
            .upload(fileName, audioBytes, {
              contentType: 'audio/mpeg',
              upsert: true
            });

          if (uploadError) {
            errors.push(`Upload failed for ${announcement.id}: ${uploadError.message}`);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from('tts-cache')
            .getPublicUrl(fileName);

          await supabase
            .from('scheduled_announcements')
            .update({
              audio_cache_url: urlData.publicUrl,
              audio_generated_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', announcement.id);

          generated++;
          console.log(`[cache-marketing-audio] Generated: ${announcement.title}`);
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
          errors.push(`Error for ${announcement.id}: ${err}`);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          generated,
          total: announcements?.length || 0,
          voice: MARKETING_VOICE,
          errors: errors.length > 0 ? errors : undefined
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: 'Invalid action. Use: generate-cache, generate-from-text, cleanup-expired, or regenerate-all' 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[cache-marketing-audio] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
