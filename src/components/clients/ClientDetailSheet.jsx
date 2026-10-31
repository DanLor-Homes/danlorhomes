import React, { useCallback, useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Paperclip,
  Pencil,
  Phone,
  Plus,
  StickyNote,
  Users,
  Loader2,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StageBadge from '@/components/crm/StageBadge';
import InteractionDialog from '@/components/interactions/InteractionDialog';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/crm';

const TYPE_ICONS = {
  llamada: Phone,
  email: Mail,
  reunion: Users,
  nota: StickyNote,
  visita: MapPin,
  whatsapp: MessageCircle,
};

export default function ClientDetailSheet({ client, open, onOpenChange, onEdit, onChanged }) {
  const [interactions, setInteractions] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [interactionOpen, setInteractionOpen] = useState(false);

  const load = useCallback(async () => {
    if (!client?.id) return;
    setLoading(true);
    const [interactionRes, oppRes] = await Promise.all([
      base44.entities.Interaction.filter({ client_id: client.id }, { sort: '-date', limit: 100 }),
      base44.entities.Opportunity.filter({ client_id: client.id }, { sort: '-updated_date', limit: 100 }),
    ]);
    setInteractions(interactionRes.items || []);
    setOpportunities(oppRes.items || []);
    setLoading(false);
  }, [client?.id]);

  useEffect(() => {
    if (open && client?.id) load();
  }, [open, client?.id, load]);

  const openAttachment = async (file) => {
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
      file_uri: file.file_uri,
      expires_in: 300,
    });
    window.open(signed_url, '_blank');
  };

  if (!client) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader className="text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <SheetTitle className="truncate font-heading text-xl">{client.name}</SheetTitle>
                <SheetDescription>{client.geographic_zone || 'Sin zona asignada'}</SheetDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => onEdit?.(client)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
              </Button>
            </div>
          </SheetHeader>

          <div className="mt-5 space-y-4">
            <div className="grid gap-2.5 rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{client.email || '—'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{client.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{client.web || '—'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">
                  {client.contact_person || '—'}
                  {client.second_contact ? ` · ${client.second_contact}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">
                  {client.employees_count ? `${client.employees_count} empleados` : 'Empleados sin definir'}
                  {client.daily_property_search ? ' · Búsqueda diaria activa' : ''}
                </span>
              </div>
            </div>

            {client.notes && (
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Notas</p>
                <p className="whitespace-pre-wrap rounded-xl border border-border/70 bg-card px-3 py-2.5 text-sm leading-relaxed">
                  {client.notes}
                </p>
              </div>
            )}

            {(client.budget_max || client.search_zones || client.property_types?.length > 0) && (
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Perfil de búsqueda
                </p>
                <p className="rounded-xl border border-border/70 bg-card px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                  {client.operation_interest === 'alquiler'
                    ? 'Alquiler'
                    : client.operation_interest === 'ambas'
                      ? 'Compra o alquiler'
                      : 'Compra'}
                  {client.budget_max ? ` · hasta ${formatCurrency(client.budget_max)}` : ''}
                  {client.search_zones ? ` · ${client.search_zones}` : ''}
                  {client.property_types?.length ? ` · ${client.property_types.join(', ')}` : ''}
                  {client.min_rooms ? ` · ${client.min_rooms}+ hab.` : ''}
                </p>
              </div>
            )}

            {client.attachments?.length > 0 && (
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Adjuntos</p>
                <div className="space-y-1.5">
                  {client.attachments.map((file, index) => (
                    <button
                      key={`${file.file_uri}-${index}`}
                      onClick={() => openAttachment(file)}
                      className="flex w-full items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-2 text-left text-xs transition-colors hover:border-primary/40"
                    >
                      <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">{file.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Oportunidades</p>
              </div>
              {opportunities.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin oportunidades asociadas.</p>
              ) : (
                <div className="space-y-1.5">
                  {opportunities.map((op) => (
                    <div key={op.id} className="rounded-xl border border-border/70 bg-card px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-medium">{op.name}</p>
                        <span className="shrink-0 text-sm font-semibold">{formatCurrency(op.amount)}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <StageBadge stage={op.stage} />
                        {op.expected_closing_date && (
                          <span className="text-[10px] text-muted-foreground">{formatDate(op.expected_closing_date)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Histórico</p>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setInteractionOpen(true)}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Registrar
                </Button>
              </div>
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : interactions.length === 0 ? (
                <p className="text-xs text-muted-foreground">Aún no hay interacciones registradas.</p>
              ) : (
                <ol className="relative space-y-3 border-l border-border/70 pl-4">
                  {interactions.map((item) => {
                    const Icon = TYPE_ICONS[item.type] || StickyNote;
                    return (
                      <li key={item.id} className="relative">
                        <span className="absolute -left-[25px] top-0.5 grid h-4 w-4 place-items-center rounded-full border border-border bg-card">
                          <Icon className="h-2.5 w-2.5 text-primary" />
                        </span>
                        <p className="text-[11px] text-muted-foreground">{formatDateTime(item.date)}</p>
                        <p className="whitespace-pre-wrap text-sm leading-snug">{item.content}</p>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <InteractionDialog
        open={interactionOpen}
        onOpenChange={setInteractionOpen}
        clients={[client]}
        defaultClientId={client.id}
        onSaved={() => {
          load();
          onChanged?.();
        }}
      />
    </>
  );
}