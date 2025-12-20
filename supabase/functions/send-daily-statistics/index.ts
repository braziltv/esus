import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get today's date in Brazil timezone
    const now = new Date();
    const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const today = brazilTime.toISOString().split('T')[0];
    const startOfDay = `${today}T00:00:00`;
    const endOfDay = `${today}T23:59:59`;

    // Get call history for today
    const { data: callHistory, error: callError } = await supabase
      .from('call_history')
      .select('*')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    if (callError) {
      console.error('Error fetching call history:', callError);
    }

    // Get patients currently in queue
    const { data: patientsInQueue, error: queueError } = await supabase
      .from('patient_calls')
      .select('*')
      .in('status', ['waiting', 'active']);

    if (queueError) {
      console.error('Error fetching patients in queue:', queueError);
    }

    // Get completed patients today
    const { data: completedPatients, error: completedError } = await supabase
      .from('patient_calls')
      .select('*')
      .eq('status', 'completed')
      .gte('completed_at', startOfDay)
      .lte('completed_at', endOfDay);

    if (completedError) {
      console.error('Error fetching completed patients:', completedError);
    }

    // Calculate statistics
    const totalCalls = callHistory?.length || 0;
    const triageCalls = callHistory?.filter(c => c.call_type === 'triage').length || 0;
    const doctorCalls = callHistory?.filter(c => c.call_type === 'doctor').length || 0;
    const patientsInQueueCount = patientsInQueue?.length || 0;
    const completedToday = completedPatients?.length || 0;

    console.log('Daily statistics:', {
      totalCalls,
      triageCalls,
      doctorCalls,
      patientsInQueueCount,
      completedToday,
    });

    // Send to Telegram
    const telegramResponse = await supabase.functions.invoke('telegram-alert', {
      body: {
        type: 'daily_statistics',
        statistics: {
          totalCalls,
          triageCalls,
          doctorCalls,
          patientsInQueue: patientsInQueueCount,
          completedToday,
        },
      },
    });

    console.log('Telegram response:', telegramResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        statistics: {
          totalCalls,
          triageCalls,
          doctorCalls,
          patientsInQueue: patientsInQueueCount,
          completedToday,
        },
        telegramSent: telegramResponse.data?.success || false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending daily statistics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
