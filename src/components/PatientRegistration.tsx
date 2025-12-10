import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Trash2, Users } from 'lucide-react';
import { Patient } from '@/types/patient';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface PatientRegistrationProps {
  patients: Patient[];
  onAddPatient: (name: string) => void;
  onRemovePatient: (id: string) => void;
}

export function PatientRegistration({ patients, onAddPatient, onRemovePatient }: PatientRegistrationProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAddPatient(name);
      setName('');
      toast.success('Paciente cadastrado com sucesso!');
    }
  };

  const activePatients = patients.filter(p => p.status !== 'attended');

  return (
    <div className="space-y-6">
      {/* Registration Form */}
      <div className="bg-card rounded-xl p-6 shadow-health border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          Cadastrar Paciente
        </h2>
        <form onSubmit={handleSubmit} className="flex gap-4">
          <Input
            type="text"
            placeholder="Nome completo do paciente"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={!name.trim()}>
            <UserPlus className="w-4 h-4 mr-2" />
            Cadastrar
          </Button>
        </form>
      </div>

      {/* Patient List */}
      <div className="bg-card rounded-xl p-6 shadow-health border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Pacientes Cadastrados ({activePatients.length})
        </h2>
        
        {activePatients.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhum paciente cadastrado
          </p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {activePatients.map((patient, index) => (
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
                      Cadastrado às {format(patient.createdAt, 'HH:mm')}
                      {' • '}
                      <span className={`font-medium ${
                        patient.status === 'waiting' ? 'text-amber-500' :
                        patient.status === 'in-triage' ? 'text-blue-500' :
                        patient.status === 'waiting-doctor' ? 'text-purple-500' :
                        'text-green-500'
                      }`}>
                        {patient.status === 'waiting' && 'Aguardando triagem'}
                        {patient.status === 'in-triage' && 'Em triagem'}
                        {patient.status === 'waiting-doctor' && 'Aguardando médico'}
                        {patient.status === 'in-consultation' && 'Em consulta'}
                      </span>
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemovePatient(patient.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
