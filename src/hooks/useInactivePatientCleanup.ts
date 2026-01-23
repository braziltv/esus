import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getBrazilTime } from './useBrazilTime';

const INACTIVE_THRESHOLD_MINUTES = 10;
const CLEANUP_INTERVAL_MS = 60000; // Check every minute

/**
 * Hook to automatically remove patients from queues after 10 minutes of inactivity
 * and filter out patients from previous days
 */
export function useInactivePatientCleanup(unitName: string) {
  const lastCleanupRef = useRef<Date>(new Date());

  const cleanupInactivePatients = useCallback(async () => {
    if (!unitName) return;

    const now = getBrazilTime();
    const thresholdTime = new Date(now.getTime() - INACTIVE_THRESHOLD_MINUTES * 60 * 1000);
    
    // Get today's date in Brazil timezone (YYYY-MM-DD format)
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    console.log(`🧹 Running patient cleanup for ${unitName}`);
    console.log(`  - Inactive threshold: ${thresholdTime.toISOString()}`);
    console.log(`  - Today start: ${todayStart.toISOString()}`);

    try {
      // 1. Delete patients from previous days (not today)
      const { data: oldPatients, error: oldError } = await supabase
        .from('patient_calls')
        .delete()
        .eq('unit_name', unitName)
        .in('status', ['waiting', 'active'])
        .lt('created_at', todayStart.toISOString())
        .select('id, patient_name');

      if (oldError) {
        console.error('Error deleting old patients:', oldError);
      } else if (oldPatients && oldPatients.length > 0) {
        console.log(`🗑️ Removed ${oldPatients.length} patients from previous days:`, 
          oldPatients.map(p => p.patient_name).join(', '));
      }

      // 2. Delete patients inactive for more than 10 minutes (active status with old timestamp)
      const { data: inactivePatients, error: inactiveError } = await supabase
        .from('patient_calls')
        .delete()
        .eq('unit_name', unitName)
        .eq('status', 'active')
        .lt('created_at', thresholdTime.toISOString())
        .select('id, patient_name, call_type');

      if (inactiveError) {
        console.error('Error deleting inactive patients:', inactiveError);
      } else if (inactivePatients && inactivePatients.length > 0) {
        console.log(`⏰ Removed ${inactivePatients.length} inactive patients (>10 min):`, 
          inactivePatients.map(p => `${p.patient_name} (${p.call_type})`).join(', '));
      }

      lastCleanupRef.current = now;

    } catch (error) {
      console.error('Error in patient cleanup:', error);
    }
  }, [unitName]);

  // Run cleanup on mount and periodically
  useEffect(() => {
    if (!unitName) return;

    // Run immediately on mount
    cleanupInactivePatients();

    // Set up periodic cleanup
    const interval = setInterval(cleanupInactivePatients, CLEANUP_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [unitName, cleanupInactivePatients]);

  return { cleanupInactivePatients };
}
