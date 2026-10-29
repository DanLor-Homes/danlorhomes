import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/crm/PageHeader';
import EmptyState from '@/components/crm/EmptyState';
import ClientFormDialog from '@/components/clients/ClientFormDialog';
import ClientDetailSheet from '@/components/clients/ClientDetailSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    const res = await base44.entities.Client.filter({}, { sort: 'name', limit: 500 });
    setClients(res.items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter(
      (client) =>
        client.name?.toLowerCase().includes(term) ||
        client.email?.toLowerCase().includes(term) ||
        client.geographic_zone?.toLowerCase().includes(term) ||
        client.contact_person?.toLowerCase().includes(term)
    );
  }, [clients, search]);

  const openDetail = (client) => {
    setSelected(client);
    setDetailOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    await base44.entities.Client.delete(toDelete.id);
    setClients((list) => list.filter((c) => c.id !== toDelete.id));
    setToDelete(null);
    toast({ title: 'Cliente eliminado' });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Cartera"
        title="Clientes"
        description={`${clients.length} fichas registradas con contacto, zona y adjuntos.`}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente"
            className="w-full pl-8 sm:w-60"
          />
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Nuevo cliente
        </Button>
      </PageHeader>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Sin clientes"
          description="Crea la primera ficha de cliente para empezar a registrar oportunidades e interacciones."
          action={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Nuevo cliente
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
          <div className="hidden grid-cols-[1.6fr_1.4fr_1fr_0.7fr_auto] gap-4 border-b border-border/70 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:grid">
            <span>Cliente</span>
            <span>Contacto</span>
            <span>Zona</span>
            <span>Empleados</span>
            <span />
          </div>
          {visible.map((client) => (
            <div
              key={client.id}
              onClick={() => openDetail(client)}
              className="group grid cursor-pointer grid-cols-1 gap-1 border-b border-border/50 px-4 py-3 transition-colors last:border-0 hover:bg-accent/40 md:grid-cols-[1.6fr_1.4fr_1fr_0.7fr_auto] md:items-center md:gap-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{client.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{client.email || 'Sin email'}</p>
              </div>
              <div className="min-w-0 text-xs text-muted-foreground">
                <p className="truncate">{client.contact_person || '—'}</p>
                <p className="truncate">{client.phone || ''}</p>
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">{client.geographic_zone || '—'}</p>
                {client.daily_property_search && (
                  <span className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    Búsqueda diaria
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{client.employees_count || '—'}</p>
              <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(event) => {
                    event.stopPropagation();
                    setEditing(client);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={(event) => {
                    event.stopPropagation();
                    setToDelete(client);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ClientFormDialog open={formOpen} onOpenChange={setFormOpen} client={editing} onSaved={load} />

      <ClientDetailSheet
        client={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={(client) => {
          setDetailOpen(false);
          setEditing(client);
          setFormOpen(true);
        }}
        onChanged={load}
      />

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(next) => !next && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la ficha del cliente. Las oportunidades e interacciones asociadas conservarán la referencia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}