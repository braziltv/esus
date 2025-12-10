import { Button } from '@/components/ui/button';
import { Phone, PhoneCall, Check, Users } from 'lucide-react';
import { Patient } from '@/types/patient';
import { format } from 'date-fns';

interface TriagePanelProps {
  waitingPatients: Patient[];
  currentCall: Patient | null;
  onCallPatient: (id: string) => void;
  onFinishTriage: (id: string) => void;
  onRecall: () => void;
}

export function TriagePanel({ 
  waitingPatients, 
  currentCall, 
  onCallPatient, 
  onFinishTriage,
  onRecall 
}: TriagePanelProps) {
  return (
    <div className="space-y-6">
      {/* Current Call */}
      <div className="bg-card rounded-xl shadow-health border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PhoneCall className="w-5 h-5" />
            Chamada Atual - Triagem
          </h2>
        </div>
        <div className="p-6">
          {currentCall ? (
            <div className="text-center">
              <p className="text-4xl font-bold text-foreground mb-4">
                {currentCall.name}
              </p>
              <p className="text-muted-foreground mb-6">
                Chamado às {format(currentCall.calledAt!, 'HH:mm')}
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={onRecall} variant="outline">
                  <Phone className="w-4 h-4 mr-2" />
                  Chamar Novamente
                </Button>
                <Button onClick={() => onFinishTriage(currentCall.id)} className="bg-green-600 hover:bg-green-700">
                  <Check className="w-4 h-4 mr-2" />
                  Finalizar Triagem
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhum paciente sendo atendido
            </p>
          )}
        </div>
      </div>

      {/* Waiting Queue */}
      <div className="bg-card rounded-xl p-6 shadow-health border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Fila de Espera ({waitingPatients.length})
        </h2>
        
        {waitingPatients.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhum paciente aguardando triagem
          </p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {waitingPatients.map((patient, index) => (
              <div
                key={patient.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-lg font-mono font-bold text-primary w-8">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{patient.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Chegou às {format(patient.createdAt, 'HH:mm')}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => onCallPatient(patient.id)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Chamar
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
