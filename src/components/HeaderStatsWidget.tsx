import { useEffect, useState } from 'react';
import { Users, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Stats {
  waitingCount: number;
  todayCalls: number;
  avgWaitTime: number;
}

interface HeaderStatsWidgetProps {
  unitName: string;
}

export function HeaderStatsWidget({ unitName }: HeaderStatsWidgetProps) {
  const [stats, setStats] = useState<Stats>({
    waitingCount: 0,
    todayCalls: 0,
    avgWaitTime: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      // Get waiting patients count
      const { count: waitingCount } = await supabase
        .from('patient_calls')
        .select('*', { count: 'exact', head: true })
        .eq('unit_name', unitName)
        .eq('status', 'waiting');

      // Get today's calls count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayCalls } = await supabase
        .from('call_history')
        .select('*', { count: 'exact', head: true })
        .eq('unit_name', unitName)
        .gte('created_at', today.toISOString());

      // Calculate average wait time (simplified - based on waiting patients)
      const { data: waitingPatients } = await supabase
        .from('patient_calls')
        .select('created_at')
        .eq('unit_name', unitName)
        .eq('status', 'waiting');

      let avgWaitTime = 0;
      if (waitingPatients && waitingPatients.length > 0) {
        const now = new Date();
        const totalMinutes = waitingPatients.reduce((acc, p) => {
          const created = new Date(p.created_at);
          return acc + Math.floor((now.getTime() - created.getTime()) / 60000);
        }, 0);
        avgWaitTime = Math.round(totalMinutes / waitingPatients.length);
      }

      setStats({
        waitingCount: waitingCount || 0,
        todayCalls: todayCalls || 0,
        avgWaitTime
      });
    } catch (error) {
      console.error('Error fetching header stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('header-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patient_calls' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_history' }, fetchStats)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [unitName]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 animate-pulse">
        <div className="h-8 w-16 bg-muted rounded" />
        <div className="h-8 w-16 bg-muted rounded" />
      </div>
    );
  }

  const statItems = [
    {
      icon: Users,
      value: stats.waitingCount,
      label: 'Aguardando',
      color: stats.waitingCount > 5 ? 'text-destructive' : stats.waitingCount > 0 ? 'text-amber-500' : 'text-green-500',
      bgColor: stats.waitingCount > 5 ? 'bg-destructive/10' : stats.waitingCount > 0 ? 'bg-amber-500/10' : 'bg-green-500/10'
    },
    {
      icon: TrendingUp,
      value: stats.todayCalls,
      label: 'Chamadas Hoje',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      icon: Clock,
      value: `${stats.avgWaitTime}m`,
      label: 'Tempo Médio',
      color: stats.avgWaitTime > 30 ? 'text-destructive' : stats.avgWaitTime > 15 ? 'text-amber-500' : 'text-green-500',
      bgColor: stats.avgWaitTime > 30 ? 'bg-destructive/10' : stats.avgWaitTime > 15 ? 'bg-amber-500/10' : 'bg-green-500/10'
    }
  ];

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5 lg:gap-2">
        {statItems.map((item, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <div 
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${item.bgColor} cursor-default transition-all hover:scale-105`}
              >
                <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                <span className={`text-xs font-semibold ${item.color}`}>
                  {item.value}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">{item.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
