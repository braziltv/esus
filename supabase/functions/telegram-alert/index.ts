import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chat ID do Telegram (você precisa iniciar uma conversa com o bot primeiro e obter o chat_id)
// Por padrão usando o número como referência, mas o Telegram usa chat_id
const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID') || '';
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';

interface AlertPayload {
  type: 'health_check_failure' | 'daily_statistics';
  functionName?: string;
  functionLabel?: string;
  errorMessage?: string;
  statistics?: {
    totalCalls: number;
    triageCalls: number;
    doctorCalls: number;
    patientsInQueue: number;
    completedToday: number;
  };
}

async function sendTelegramMessage(message: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('Telegram credentials not configured');
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();
    console.log('Telegram response:', result);
    return result.ok === true;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
}

function formatHealthCheckAlert(payload: AlertPayload): string {
  const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  return `🚨 <b>ALERTA: Edge Function com Falha</b>

📍 <b>Função:</b> ${payload.functionLabel || payload.functionName}
❌ <b>Erro:</b> ${payload.errorMessage || 'Erro desconhecido'}
🕐 <b>Horário:</b> ${timestamp}

⚠️ Verifique o painel de monitoramento para mais detalhes.`;
}

function formatDailyStatistics(payload: AlertPayload): string {
  const stats = payload.statistics;
  const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  
  if (!stats) {
    return `📊 <b>Estatísticas Diárias</b>\n\nNenhuma estatística disponível.`;
  }

  return `📊 <b>Estatísticas Diárias - Xama Pan</b>

🕐 <b>Relatório de:</b> ${timestamp}

📈 <b>Resumo do Dia:</b>
• Total de Chamadas: <b>${stats.totalCalls}</b>
• Triagem: <b>${stats.triageCalls}</b>
• Médico: <b>${stats.doctorCalls}</b>

👥 <b>Status Atual:</b>
• Na Fila: <b>${stats.patientsInQueue}</b>
• Concluídos Hoje: <b>${stats.completedToday}</b>

✅ Sistema funcionando normalmente.`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: AlertPayload = await req.json();
    console.log('Received alert payload:', payload);

    let message = '';
    
    if (payload.type === 'health_check_failure') {
      message = formatHealthCheckAlert(payload);
    } else if (payload.type === 'daily_statistics') {
      message = formatDailyStatistics(payload);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid alert type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const success = await sendTelegramMessage(message);

    return new Response(
      JSON.stringify({ success, message: success ? 'Alert sent' : 'Failed to send alert' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing alert:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
