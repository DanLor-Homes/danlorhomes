import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
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
import EmptyState from '@/components/crm/EmptyState';
import MlsPartnerDialog from '@/components/mls/MlsPartnerDialog';
import { formatSyncDate } from '@/lib/mlsFeed';
import { Building2, Mail, Pencil, Phone, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MlsPartnersPanel({ partners, onChanged }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [syncing, setSyncing] = useState({});
  const [syncingAll, setSyncingAll] = useState(false);

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (partner) => {
    setEditing(partner);
    setOpen(true);
  };

  const handleDelete = async (partner) => {
    await base44.entities.MlsPartner.delete(partner.id);
    toast({ title: 'Agencia eliminada de la red' });
    onChanged?.();
  };

  const syncPartner = async (partner) => {
    setSyncing((prev) => ({ ...prev, [partner.id]: true }));
    try {
      const response = await base44.functions.invoke('mlsSyncPartner', { partner_id: partner.id });
      const { created = 0, updated = 0, retired = 0 } = response.data || {};
      toast({
        title: `Sincronizado con ${partner.name}`,
        description: `${created} nuevos · ${updated} actualizados${retired ? ` · ${retired} retirados` : ''}`,
      });
      return true;
    } catch (error) {
      toast({
        title: `No se pudo sincronizar ${partner.name}`,
        description: error?.response?.data?.error || error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setSyncing((prev) => ({ ...prev, [partner.id]: false }));
    }
  };

  const syncAll = async () => {
    const withFeed = partners.filter((partner) => partner.feed_url && partner.active !== false);
    setSyncingAll(true);
    try {
      for (const partner of withFeed) {
        await syncPartner(partner);
      }
    } finally {
      setSyncingAll(false);
      onChanged?.();
    }
  };

  const handleSyncOne = async (partner) => {
    await syncPartner(partner);
    onChanged?.();
  };

  const partnersWithFeed = partners.filter((partner) => partner.feed_url && partner.active !== false).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Tu red de confianza: agencias con las que compartes cartera y honorarios.
        </p>
        <div className="flex shrink-0 gap-1.5">
          {partnersWithFeed > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={syncAll}
              disabled={syncingAll}
            >
              <RefreshCw className={cn('h-4 w-4', syncingAll && 'animate-spin')} /> Sincronizar red
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-1.5" onClick={openNew}>
            <Plus className="h-4 w-4" /> Añadir agencia
          </Button>
        </div>
      </div>

      {!partners.length ? (
        <EmptyState
          icon={Building2}
          title="Sin agencias en la red"
          description="Da de alta las agencias colaboradoras para tener sus contactos y acuerdos a mano."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {partners.map((partner) => {
            const isSyncing = Boolean(syncing[partner.id]);
            const lastSync = formatSyncDate(partner.last_sync_at);
            return (
              <article key={partner.id} className="card-surface flex flex-col gap-2 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-heading text-[15px] font-semibold leading-tight">
                      {partner.name}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {partner.contact_person || 'Sin contacto'} {partner.zone ? `· ${partner.zone}` : ''}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                      partner.active === false
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-chart-2/15 text-chart-2'
                    )}
                  >
                    {partner.active === false ? 'Inactiva' : 'Activa'}
                  </span>
                </div>

                <div className="flex flex-col gap-1 text-[11px]">
                  {partner.email && (
                    <a
                      href={`mailto:${partner.email}`}
                      className="inline-flex items-center gap-1 truncate text-primary hover:underline"
                    >
                      <Mail className="h-3 w-3 shrink-0" /> {partner.email}
                    </a>
                  )}
                  {partner.phone && (
                    <a
                      href={`tel:${partner.phone}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <Phone className="h-3 w-3" /> {partner.phone}
                    </a>
                  )}
                </div>

                {partner.commission_notes && (
                  <p className="rounded-lg bg-muted/50 p-2 text-[11px] leading-relaxed text-muted-foreground">
                    {partner.commission_notes}
                  </p>
                )}

                {partner.feed_url ? (
                  <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                    {partner.last_sync_error
                      ? `Error en la última sincronización: ${partner.last_sync_error}`
                      : lastSync
                        ? `Feed conectado · ${lastSync} · ${partner.last_sync_count ?? 0} inmuebles`
                        : 'Feed conectado · sin sincronizar todavía'}
                  </p>
                ) : (
                  <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                    Sin enlace de feed: añádelo en Editar para traer su cartera.
                  </p>
                )}

                <div className="mt-auto flex items-center gap-1.5 pt-1">
                  {partner.feed_url && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 gap-1 px-2"
                      onClick={() => handleSyncOne(partner)}
                      disabled={isSyncing}
                    >
                      <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin')} /> Sincronizar
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-7 gap-1 px-2" onClick={() => openEdit(partner)}>
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar {partner.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se borrarán sus datos de contacto y el acuerdo de colaboración guardado.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(partner)}>Eliminar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {open && (
        <MlsPartnerDialog
          key={editing?.id || 'new'}
          open={open}
          partner={editing}
          onOpenChange={setOpen}
          onSaved={onChanged}
        />
      )}
    </div>
  );
}