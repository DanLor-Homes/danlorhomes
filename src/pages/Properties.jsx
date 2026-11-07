import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Loader2, MonitorPlay, Plus, Search, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/crm/PageHeader';
import EmptyState from '@/components/crm/EmptyState';
import StatCard from '@/components/crm/StatCard';
import PropertyCard from '@/components/properties/PropertyCard';
import PropertyFormDialog from '@/components/properties/PropertyFormDialog';
import PropertyDetailSheet from '@/components/properties/PropertyDetailSheet';
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
import { DragDropContext } from '@hello-pangea/dnd';
import DragStatusDock from '@/components/drag/DragStatusDock';
import DragList from '@/components/drag/DragList';
import DraggableItem from '@/components/drag/DraggableItem';
import useStatusDragDrop from '@/hooks/useStatusDragDrop';
import { formatCurrency } from '@/lib/crm';
import { PROPERTY_STATUS, findMatches, propertyStatusLabel } from '@/lib/properties';
import { cn } from '@/lib/utils';

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const { toast } = useToast();

  const drag = useStatusDragDrop({
    onMove: async (id, status) => {
      const property = properties.find((item) => item.id === id);
      if (!property || property.status === status) return;
      setProperties((list) => list.map((item) => (item.id === id ? { ...item, status } : item)));
      await base44.entities.Property.update(id, { status });
      toast({ title: 'Inmueble actualizado', description: `${property.title} → ${propertyStatusLabel(status)}` });
    },
    onTrash: (id) => {
      const property = properties.find((item) => item.id === id);
      if (property) setToDelete(property);
    },
  });

  const load = useCallback(async () => {
    const [propertyRes, clientRes] = await Promise.all([
      base44.entities.Property.filter({}, { sort: '-created_date', limit: 500 }),
      base44.entities.Client.filter({}, { sort: 'name', limit: 500 }),
    ]);
    setProperties(propertyRes.items || []);
    setClients(clientRes.items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const matchesByProperty = useMemo(() => {
    const map = new Map();
    properties.forEach((property) => map.set(property.id, findMatches(property, clients).length));
    return map;
  }, [properties, clients]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return properties.filter((property) => {
      if (statusFilter !== 'todos' && property.status !== statusFilter) return false;
      if (!term) return true;
      return (
        property.title?.toLowerCase().includes(term) ||
        property.zone?.toLowerCase().includes(term) ||
        property.reference?.toLowerCase().includes(term) ||
        property.address?.toLowerCase().includes(term)
      );
    });
  }, [properties, search, statusFilter]);

  const stats = useMemo(() => {
    const available = properties.filter((property) => property.status === 'disponible');
    const portfolioValue = properties
      .filter((property) => (property.operation || 'venta') === 'venta' && property.status !== 'retirado')
      .reduce((sum, property) => sum + (Number(property.price) || 0), 0);
    const withMatches = properties.filter((property) => (matchesByProperty.get(property.id) || 0) > 0).length;
    return { available: available.length, portfolioValue, withMatches };
  }, [properties, matchesByProperty]);

  const openDetail = (property) => {
    setSelected(property);
    setDetailOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    await base44.entities.Property.delete(toDelete.id);
    setProperties((list) => list.filter((item) => item.id !== toDelete.id));
    setToDelete(null);
    toast({ title: 'Inmueble eliminado' });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Cartera de captación"
        title="Inmuebles"
        description={`${properties.length} inmuebles en cartera con ficha completa, valoración por comparables y cruce con demandantes.`}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar inmueble"
            className="w-full pl-8 sm:w-56"
          />
        </div>
        <Button variant="outline" onClick={() => window.open('/panel', '_blank')}>
          <MonitorPlay className="mr-1.5 h-4 w-4" /> Panel LED
        </Button>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Nuevo inmueble
        </Button>
      </PageHeader>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Disponibles" value={stats.available} hint={`${properties.length} en cartera`} icon={Building2} tone="primary" />
        <StatCard label="Valor de cartera" value={formatCurrency(stats.portfolioValue, true)} hint="Inmuebles en venta" tone="emerald" />
        <StatCard label="Con demandantes" value={stats.withMatches} hint="Encaje automático activo" tone="violet" />
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {[{ id: 'todos', label: 'Todos' }, ...PROPERTY_STATUS].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setStatusFilter(option.id)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              statusFilter === option.id
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Sin inmuebles"
          description="Registra el primer inmueble con sus fotos, situación legal y honorarios para empezar a cruzar demandantes."
          action={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Nuevo inmueble
            </Button>
          }
        />
      ) : (
        <DragDropContext onDragStart={drag.handleDragStart} onDragEnd={drag.handleDragEnd}>
          <DragStatusDock
            statuses={PROPERTY_STATUS}
            dragging={drag.dragging}
            hint="Arrastra un inmueble para cambiar su estado"
          />
          <DragList className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((property, index) => (
              <DraggableItem key={property.id} id={property.id} index={index}>
                <div className="group relative">
                  <PropertyCard
                    property={property}
                    matches={matchesByProperty.get(property.id) || 0}
                    onClick={() => openDetail(property)}
                  />
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setToDelete(property);
                    }}
                    aria-label={`Eliminar ${property.title}`}
                    className="absolute right-2 top-2 rounded-md bg-background/85 p-1.5 text-muted-foreground opacity-0 backdrop-blur transition-opacity hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </DraggableItem>
            ))}
          </DragList>
        </DragDropContext>
      )}

      <PropertyFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        property={editing}
        clients={clients}
        onSaved={load}
      />

      <PropertyDetailSheet
        property={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={(property) => {
          setDetailOpen(false);
          setEditing(property);
          setFormOpen(true);
        }}
        onOpenClient={() => {
          setDetailOpen(false);
          window.location.assign('/leads');
        }}
        onDelete={(property) => {
          setDetailOpen(false);
          setToDelete(property);
        }}
        onChanged={load}
      />

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(next) => !next && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {toDelete?.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la ficha del inmueble y su documentación asociada. Esta acción no se puede deshacer.
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