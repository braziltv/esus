import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { decode as base64Decode, encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para criar JWT para autenticação com Google Cloud
async function createJWT(credentials: any): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: credentials.token_uri,
    iat: now,
    exp: now + 3600 // Token válido por 1 hora
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Importar a chave privada
  const privateKey = await importPrivateKey(credentials.private_key);
  
  // Assinar
  const signature = await sign(signatureInput, privateKey);
  const encodedSignature = base64UrlEncode(signature);

  return `${signatureInput}.${encodedSignature}`;
}

function base64UrlEncode(data: string | Uint8Array): string {
  const base64 = typeof data === 'string' 
    ? btoa(data) 
    : btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  // Remover header/footer do PEM
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '');
  
  const binaryDer = base64Decode(pemContents);
  
  // Criar ArrayBuffer explícito
  const keyBuffer = new ArrayBuffer(binaryDer.length);
  const keyView = new Uint8Array(keyBuffer);
  keyView.set(binaryDer);
  
  return await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
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

// Obter access token usando JWT
async function getAccessToken(credentials: any): Promise<string> {
  const jwt = await createJWT(credentials);
  
  const response = await fetch(credentials.token_uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[google-cloud-tts] Erro ao obter access token:', error);
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Vozes disponíveis no Google Cloud TTS para pt-BR
const VOICES = {
  female: {
    languageCode: 'pt-BR',
    name: 'pt-BR-Neural2-A', // Voz feminina neural de alta qualidade
    ssmlGender: 'FEMALE'
  },
  male: {
    languageCode: 'pt-BR', 
    name: 'pt-BR-Neural2-B', // Voz masculina neural de alta qualidade
    ssmlGender: 'MALE'
  }
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice = 'female', speakingRate = 1.0 } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[google-cloud-tts] Gerando áudio para: "${text}" com voz ${voice}`);

    // Carregar credenciais
    const credentialsJson = Deno.env.get('GOOGLE_CLOUD_CREDENTIALS');
    if (!credentialsJson) {
      throw new Error('GOOGLE_CLOUD_CREDENTIALS not configured');
    }

    const credentials = JSON.parse(credentialsJson);
    
    // Obter access token
    const accessToken = await getAccessToken(credentials);
    
    // Selecionar voz
    const selectedVoice = voice === 'male' ? VOICES.male : VOICES.female;

    // Chamar Google Cloud TTS API
    const ttsResponse = await fetch(
      'https://texttospeech.googleapis.com/v1/text:synthesize',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: { text },
          voice: selectedVoice,
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: speakingRate,
            pitch: 0,
            volumeGainDb: 0
          }
        })
      }
    );

    if (!ttsResponse.ok) {
      const error = await ttsResponse.text();
      console.error('[google-cloud-tts] Erro da API:', error);
      throw new Error(`Google Cloud TTS error: ${ttsResponse.status} - ${error}`);
    }

    const ttsData = await ttsResponse.json();
    
    // O áudio vem em base64
    const audioBytes = base64Decode(ttsData.audioContent);
    
    // Criar ArrayBuffer explícito para Response
    const audioBuffer = new ArrayBuffer(audioBytes.length);
    const audioView = new Uint8Array(audioBuffer);
    audioView.set(audioBytes);

    console.log(`[google-cloud-tts] Áudio gerado com sucesso: ${audioBytes.length} bytes`);

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg'
      }
    });

  } catch (error) {
    console.error('[google-cloud-tts] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
