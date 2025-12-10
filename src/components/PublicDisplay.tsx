import { Patient, CallHistory as CallHistoryType } from '@/types/patient';
import { Volume2, Clock, Stethoscope, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';

interface PublicDisplayProps {
  currentTriageCall: Patient | null;
  currentDoctorCall: Patient | null;
  history: CallHistoryType[];
}

export function PublicDisplay({ currentTriageCall, currentDoctorCall, history }: PublicDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl gradient-health flex items-center justify-center shadow-glow">
            <Volume2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Painel de Chamadas
            </h1>
            <p className="text-muted-foreground">Unidade Básica de Saúde</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-4xl font-mono font-bold text-foreground">
            {format(currentTime, 'HH:mm')}
          </p>
          <p className="text-muted-foreground">
            {format(currentTime, "dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-180px)]">
        {/* Current Calls */}
        <div className="col-span-2 grid grid-rows-2 gap-6">
          {/* Triage Call */}
          <div className="bg-card rounded-3xl shadow-health-xl border border-border overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
              <p className="text-white text-xl font-bold flex items-center gap-2">
                <Activity className="w-6 h-6" />
                TRIAGEM
              </p>
            </div>
            <div className="p-8 flex items-center justify-center h-[calc(100%-64px)]">
              {currentTriageCall ? (
                <div className="text-center animate-scale-in">
                  <h2 className="text-5xl font-bold text-foreground">
                    {currentTriageCall.name}
                  </h2>
                </div>
              ) : (
                <p className="text-2xl text-muted-foreground">
                  Aguardando próxima chamada
                </p>
              )}
            </div>
          </div>

          {/* Doctor Call */}
          <div className="bg-card rounded-3xl shadow-health-xl border border-border overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
              <p className="text-white text-xl font-bold flex items-center gap-2">
                <Stethoscope className="w-6 h-6" />
                CONSULTÓRIO MÉDICO
              </p>
            </div>
            <div className="p-8 flex items-center justify-center h-[calc(100%-64px)]">
              {currentDoctorCall ? (
                <div className="text-center animate-scale-in">
                  <h2 className="text-5xl font-bold text-foreground">
                    {currentDoctorCall.name}
                  </h2>
                </div>
              ) : (
                <p className="text-2xl text-muted-foreground">
                  Aguardando próxima chamada
                </p>
              )}
            </div>
          </div>
        </div>

        {/* History Panel */}
        <div className="bg-card rounded-3xl shadow-health-lg border border-border p-6 overflow-hidden">
          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" />
            Últimas Chamadas
          </h3>
          <div className="space-y-3 overflow-y-auto h-[calc(100%-60px)]">
            {history.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma chamada ainda
              </p>
            ) : (
              history.map((item, index) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl ${index === 0 ? 'bg-primary/10 border-2 border-primary/30' : 'bg-muted/50'} animate-fade-in`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.calledBy === 'triage' ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      {item.calledBy === 'triage' ? (
                        <Activity className="w-5 h-5 text-white" />
                      ) : (
                        <Stethoscope className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {item.patient.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.calledBy === 'triage' ? 'Triagem' : 'Médico'}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(item.calledAt, 'HH:mm')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
