import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Edit, Trash2, Loader2, Eye, EyeOff, Shield, Building2, AlertTriangle } from 'lucide-react';
import { useOperators, useModules, useUnits } from '@/hooks/useAdminData';
import { Operator, UserRole, DEFAULT_ROLE_PERMISSIONS } from '@/types/admin';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OperatorsManagerProps {
  unitId: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  recepcao: 'Recepção',
  triagem: 'Triagem',
  medico: 'Médico',
  enfermagem: 'Enfermagem',
  custom: 'Personalizado'
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-500/20 text-red-500',
  recepcao: 'bg-blue-500/20 text-blue-500',
  triagem: 'bg-green-500/20 text-green-500',
  medico: 'bg-purple-500/20 text-purple-500',
  enfermagem: 'bg-amber-500/20 text-amber-500',
  custom: 'bg-gray-500/20 text-gray-500'
};

export function OperatorsManager({ unitId }: OperatorsManagerProps) {
  const { operators, loading, createOperator, updateOperator, deleteOperator } = useOperators(unitId);
  const { modules } = useModules(unitId);
  const { units } = useUnits();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password_hash: '',
    role: 'recepcao' as UserRole,
    is_active: true,
    unit_id: unitId
  });
  
  // Update unit_id when unitId prop changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, unit_id: unitId }));
  }, [unitId]);
  
  // Get current unit name
  const currentUnit = units.find(u => u.id === unitId);

  const handleOpenCreate = () => {
    setEditingOperator(null);
    setFormData({
      name: '',
      username: '',
      password_hash: '',
      role: 'recepcao',
      is_active: true,
      unit_id: unitId
    });
    setCustomPermissions([]);
    setDialogOpen(true);
  };

  const handleOpenEdit = (op: Operator) => {
    setEditingOperator(op);
    setFormData({
      name: op.name,
      username: op.username,
      password_hash: '',
      role: op.role,
      is_active: op.is_active,
      unit_id: op.unit_id
    });
    setCustomPermissions([]);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      ...formData,
      unit_id: unitId,
      // Apenas atualiza a senha se foi preenchida
      ...(formData.password_hash ? { password_hash: formData.password_hash } : {})
    };
    
    if (editingOperator) {
      // Remove password_hash vazio do update
      const updatePayload = { ...payload };
      if (!updatePayload.password_hash) {
        delete (updatePayload as any).password_hash;
      }
      await updateOperator(editingOperator.id, updatePayload);
    } else {
      await createOperator(payload);
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este operador?')) {
      await deleteOperator(id);
    }
  };

  const toggleCustomPermission = (moduleCode: string) => {
    setCustomPermissions(prev => 
      prev.includes(moduleCode) 
        ? prev.filter(c => c !== moduleCode)
        : [...prev, moduleCode]
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Operadores do Sistema
        </CardTitle>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Novo Operador
        </Button>
      </CardHeader>
      <CardContent>
        {/* Alert about unit restriction */}
        <Alert className="mb-4 border-primary/50 bg-primary/5">
          <Building2 className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Lotação:</strong> Os operadores criados aqui só poderão fazer login na unidade <span className="font-semibold text-primary">{currentUnit?.display_name || currentUnit?.name || 'atual'}</span>.
          </AlertDescription>
        </Alert>
        
        {operators.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Nenhum operador cadastrado. Clique em "Novo Operador" para criar.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Lotação</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operators.map((op) => {
                const opUnit = units.find(u => u.id === op.unit_id);
                return (
                  <TableRow key={op.id}>
                    <TableCell className="font-medium">{op.name}</TableCell>
                    <TableCell className="text-muted-foreground">{op.username}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-secondary/50">
                        <Building2 className="w-3 h-3 mr-1" />
                        {opUnit?.display_name || opUnit?.name || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={ROLE_COLORS[op.role]}>
                        <Shield className="w-3 h-3 mr-1" />
                        {ROLE_LABELS[op.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${op.is_active ? 'bg-panel-success/20 text-green-600 dark:text-green-400' : 'bg-destructive/20 text-destructive'}`}>
                        {op.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(op)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(op.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingOperator ? 'Editar Operador' : 'Novo Operador'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Maria da Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Nome de Usuário</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    placeholder="Ex: maria.silva"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">
                  {editingOperator ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password_hash}
                    onChange={(e) => setFormData({ ...formData, password_hash: e.target.value })}
                    placeholder={editingOperator ? '••••••••' : 'Digite a senha'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Unit selection (Lotação) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Lotação (Unidade de Acesso)
                </Label>
                <Select 
                  value={formData.unit_id} 
                  onValueChange={(value) => setFormData({ ...formData, unit_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span>{unit.display_name || unit.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Alert className="mt-2 border-amber-500/50 bg-amber-500/10">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-xs text-amber-600 dark:text-amber-400">
                    O operador só poderá fazer login na unidade selecionada. Se tentar acessar outra unidade, receberá um aviso de "Lotação incorreta".
                  </AlertDescription>
                </Alert>
              </div>

              <div className="space-y-2">
                <Label>Perfil de Acesso</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          <span>{ROLE_LABELS[role]}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.role !== 'custom' && formData.role !== 'admin' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {DEFAULT_ROLE_PERMISSIONS[formData.role].description}
                  </p>
                )}
              </div>

              {formData.role === 'custom' && (
                <div className="space-y-2">
                  <Label>Módulos Permitidos</Label>
                  <div className="border rounded-md p-3 space-y-2">
                    {modules.map((mod) => (
                      <div key={mod.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`mod-${mod.id}`}
                          checked={customPermissions.includes(mod.code)}
                          onCheckedChange={() => toggleCustomPermission(mod.code)}
                        />
                        <label htmlFor={`mod-${mod.id}`} className="text-sm cursor-pointer">
                          {mod.name}
                        </label>
                      </div>
                    ))}
                    {modules.length === 0 && (
                      <p className="text-sm text-muted-foreground">Nenhum módulo cadastrado.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Operador Ativo</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.name || !formData.username || (!editingOperator && !formData.password_hash)}>
                {editingOperator ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
