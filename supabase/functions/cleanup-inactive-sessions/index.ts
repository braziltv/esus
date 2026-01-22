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

    // Parse optional parameters
    const body = await req.json().catch(() => ({}))
    const inactiveMinutes = body.inactiveMinutes || 10 // Default: 10 minutes for TV sessions
    const inactiveHours = body.inactiveHours || 2 // Default: 2 hours for regular sessions

    const now = new Date()
    
    // Calculate cutoff times
    const tvCutoff = new Date(now.getTime() - inactiveMinutes * 60 * 1000)
    const regularCutoff = new Date(now.getTime() - inactiveHours * 60 * 60 * 1000)

    console.log(`Cleaning up sessions inactive since:`)
    console.log(`- TV sessions: ${tvCutoff.toISOString()} (${inactiveMinutes} min)`)
    console.log(`- Regular sessions: ${regularCutoff.toISOString()} (${inactiveHours} hours)`)

    // Count sessions before cleanup
    const { count: beforeCount } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Delete inactive TV sessions (stricter timeout)
    const { data: deletedTvSessions, error: tvError } = await supabase
      .from('user_sessions')
      .delete()
      .eq('is_active', true)
      .eq('is_tv_mode', true)
      .lt('last_activity_at', tvCutoff.toISOString())
      .select('id, unit_name, station')

    if (tvError) {
      console.error('Error deleting TV sessions:', tvError)
    }

    // Delete inactive regular sessions (more lenient timeout)
    const { data: deletedRegularSessions, error: regularError } = await supabase
      .from('user_sessions')
      .delete()
      .eq('is_active', true)
      .eq('is_tv_mode', false)
      .lt('last_activity_at', regularCutoff.toISOString())
      .select('id, unit_name, station')

    if (regularError) {
      console.error('Error deleting regular sessions:', regularError)
    }

    // Also mark very old sessions as inactive instead of deleting (for history)
    const historyRetentionDays = 7
    const historyCutoff = new Date(now.getTime() - historyRetentionDays * 24 * 60 * 60 * 1000)
    
    const { data: archivedSessions, error: archiveError } = await supabase
      .from('user_sessions')
      .update({ is_active: false, logout_at: now.toISOString() })
      .eq('is_active', true)
      .lt('last_activity_at', historyCutoff.toISOString())
      .select('id')

    if (archiveError) {
      console.error('Error archiving old sessions:', archiveError)
    }

    // Count sessions after cleanup
    const { count: afterCount } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const tvDeleted = deletedTvSessions?.length || 0
    const regularDeleted = deletedRegularSessions?.length || 0
    const archived = archivedSessions?.length || 0
    const totalCleaned = tvDeleted + regularDeleted + archived

    const summary = {
      success: true,
      timestamp: now.toISOString(),
      cleanup: {
        tv_sessions_deleted: tvDeleted,
        regular_sessions_deleted: regularDeleted,
        sessions_archived: archived,
        total_cleaned: totalCleaned,
      },
      sessions: {
        before: beforeCount || 0,
        after: afterCount || 0,
      },
      thresholds: {
        tv_inactive_minutes: inactiveMinutes,
        regular_inactive_hours: inactiveHours,
        archive_after_days: historyRetentionDays,
      }
    }

    console.log('Cleanup completed:', JSON.stringify(summary))

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in cleanup-inactive-sessions:', error)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
