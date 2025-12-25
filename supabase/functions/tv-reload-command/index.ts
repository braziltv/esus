import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const body = await req.json().catch(() => ({}))
    const { unitName } = body

    // Create a channel and send broadcast
    const channel = supabase.channel('tv-commands')
    
    await channel.subscribe()
    
    // Small delay to ensure subscription is established
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const result = await channel.send({
      type: 'broadcast',
      event: 'reload',
      payload: {
        command: 'reload',
        unitName: unitName || null,
        timestamp: new Date().toISOString(),
        source: 'edge-function'
      }
    })

    console.log('Broadcast result:', result)
    
    // Cleanup
    await supabase.removeChannel(channel)

    return new Response(
      JSON.stringify({
        success: true,
        message: unitName 
          ? `Comando de reload enviado para TV da unidade: ${unitName}`
          : 'Comando de reload enviado para todas as TVs',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error sending reload command:', error)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
