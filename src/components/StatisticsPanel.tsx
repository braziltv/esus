import { Patient, CallHistory } from '@/types/patient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Clock, 
  Activity, 
  Stethoscope, 
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface StatisticsPanelProps {
  patients: Patient[];
  history: CallHistory[];
}

export function StatisticsPanel({ patients, history }: StatisticsPanelProps) {
  // Calcular estatísticas
  const totalPatients = patients.length;
  const waitingTriage = patients.filter(p => p.status === 'waiting').length;
  const waitingDoctor = patients.filter(p => p.status === 'waiting-doctor').length;
  const inTriage = patients.filter(p => p.status === 'in-triage').length;
  const inConsultation = patients.filter(p => p.status === 'in-consultation').length;
  const attended = patients.filter(p => p.status === 'attended').length;

  // Calcular tempo médio de espera (em minutos)
  const patientsWithWaitTime = patients.filter(p => p.calledAt && p.createdAt);
  const avgWaitTime = patientsWithWaitTime.length > 0
    ? Math.round(
        patientsWithWaitTime.reduce((acc, p) => {
          const waitTime = (p.calledAt!.getTime() - p.createdAt.getTime()) / (1000 * 60);
          return acc + waitTime;
        }, 0) / patientsWithWaitTime.length
      )
    : 0;

  // Atendimentos por hora
  const now = new Date();
  const hourlyData = Array.from({ length: 8 }, (_, i) => {
    const hour = now.getHours() - 7 + i;
    const adjustedHour = hour < 0 ? hour + 24 : hour;
    const count = history.filter(h => {
      const callHour = h.calledAt.getHours();
      return callHour === adjustedHour;
    }).length;
    return {
      hour: `${adjustedHour.toString().padStart(2, '0')}:00`,
      atendimentos: count,
    };
  });

  // Dados para gráfico de pizza
  const statusData = [
    { name: 'Aguardando Triagem', value: waitingTriage, color: 'hsl(var(--chart-1))' },
    { name: 'Em Triagem', value: inTriage, color: 'hsl(var(--chart-2))' },
    { name: 'Aguardando Médico', value: waitingDoctor, color: 'hsl(var(--chart-3))' },
    { name: 'Em Consulta', value: inConsultation, color: 'hsl(var(--chart-4))' },
    { name: 'Atendidos', value: attended, color: 'hsl(var(--chart-5))' },
  ].filter(item => item.value > 0);

  const chartConfig = {
    atendimentos: {
      label: 'Atendimentos',
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Estatísticas do Dia</h2>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Triagem</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{waitingTriage}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Triagem</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inTriage}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Médico</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{waitingDoctor}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Consulta</CardTitle>
            <Stethoscope className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{inConsultation}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atendidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{attended}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tempo Médio de Espera */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Tempo Médio de Espera</CardTitle>
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">
            {avgWaitTime} <span className="text-lg font-normal text-muted-foreground">minutos</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Baseado em {patientsWithWaitTime.length} pacientes chamados
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Gráfico de Atendimentos por Hora */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Atendimentos por Hora</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={hourlyData}>
                <XAxis dataKey="hour" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="atendimentos" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Nenhum paciente registrado
              </div>
            )}
            {/* Legenda */}
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              {statusData.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }} 
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Últimas Chamadas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Últimas Chamadas</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="space-y-2">
              {history.slice(0, 10).map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {item.calledBy === 'triage' ? (
                      <Activity className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Stethoscope className="h-4 w-4 text-purple-500" />
                    )}
                    <span className="font-medium">{item.patient.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className={item.calledBy === 'triage' ? 'text-blue-500' : 'text-purple-500'}>
                      {item.calledBy === 'triage' ? 'Triagem' : 'Médico'}
                    </span>
                    <span>
                      {item.calledAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Nenhuma chamada registrada
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
