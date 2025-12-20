import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const ADMIN_PASSWORD = 'Paineiras@1';

interface AdminPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export function AdminPasswordDialog({ 
  isOpen, 
  onClose, 
  onSuccess,
  title = "Acesso Administrativo",
  description = "Digite a senha administrativa para continuar."
}: AdminPasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === ADMIN_PASSWORD) {
      toast.success('Acesso autorizado');
      setPassword('');
      onSuccess();
    } else {
      toast.error('Senha incorreta');
    }
  };

  const handleClose = () => {
    setPassword('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="admin-password">Senha Administrativa</Label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha"
                autoFocus
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2">
              <ShieldCheck className="w-4 h-4" />
              Acessar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Hook para gerenciar autenticação administrativa na sessão
export function useAdminAuth() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const requireAdminAuth = (callback: () => void) => {
    if (isAdminAuthenticated) {
      callback();
    } else {
      setShowPasswordDialog(true);
    }
  };

  const handleAuthSuccess = (callback: () => void) => {
    setIsAdminAuthenticated(true);
    setShowPasswordDialog(false);
    callback();
  };

  const resetAuth = () => {
    setIsAdminAuthenticated(false);
  };

  return {
    isAdminAuthenticated,
    showPasswordDialog,
    setShowPasswordDialog,
    requireAdminAuth,
    handleAuthSuccess,
    resetAuth,
  };
}
