import React from 'react';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { formatDateTime } from '@/lib/crm';
import { INTEREST_STATUSES, INTEREST_STATUS_STYLES, interestStatusLabel } from '@/lib/mls';
import EmptyState from '@/components/crm/EmptyState';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Building2, Mail, MessageSquare, Phone, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MlsInterestsPanel({ interests, onChanged }) {
  const { toast } = useToast();

  const handleStatus = async (interest, status) => {
    await base44.entities.MlsInterest.update(interest.id, { status });
    toast({ title: 'Seguimiento actualizado' });
    onChanged?.();
  };

  const handleDelete = async (interest) => {
    await base44.entities.MlsInterest.delete(interest.id);
    toast({ title: 'Solicitud eliminada' });
    onChanged?.();
  };

  if (!interests.length) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Sin solicitudes de la red"
        description="Cuando otra agencia se interese por uno de tus inmuebles compartidos, verás aquí su contacto."
      />
    );
  }

  return (
    <div className="space-y-2.5">
      {interests.map((interest) => (
        <article key={interest.id} className="card-surface space-y-2 p-3.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 font-heading text-[15px] font-semibold leading-tight">
                <Building2 className="h-4 w-4 shrink-0 text-primary" />
                {interest.agency}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {interest.listing_title ? `Sobre: ${interest.listing_title}` : 'Inmueble de la bolsa'}
                {interest.created_date ? ` · ${formatDateTime(interest.created_date)}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                  INTEREST_STATUS_STYLES[interest.status] || 'bg-muted text-muted-foreground'
                )}
              >
                {interestStatusLabel(interest.status)}
              </span>
              <Select
                value={interest.status || 'nuevo'}
                onValueChange={(value) => handleStatus(interest, value)}
              >
                <SelectTrigger className="h-8 w-[128px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTEREST_STATUSES.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {interest.message && (
            <p className="rounded-lg bg-muted/50 p-2.5 text-xs leading-relaxed">{interest.message}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
            {interest.agent_name && <span className="font-medium">{interest.agent_name}</span>}
            {interest.email && (
              <a href={`mailto:${interest.email}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                <Mail className="h-3 w-3" /> {interest.email}
              </a>
            )}
            {interest.phone && (
              <a href={`tel:${interest.phone}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                <Phone className="h-3 w-3" /> {interest.phone}
              </a>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-auto h-7 gap-1 px-2 text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar esta solicitud?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se borrará el registro de contacto de {interest.agency}. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(interest)}>Eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </article>
      ))}
    </div>
  );
}