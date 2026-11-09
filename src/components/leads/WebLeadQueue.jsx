import React, { useCallback, useEffect, useState } from 'react';
import moment from 'moment';
import { Inbox, Loader2, UserPlus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ruleForZone } from '@/lib/assignment';
import { formatCurrency } from '@/lib/crm';

const OPERATION_LABELS = { venta: 'Compra', alquiler: 'Alquiler', ambas: 'Compra o alquiler' };

export default function WebLeadQueue({ onConverted }) {
  const [leads, setLeads] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    const [leadRes, ruleRes] = await Promise.all([
      base44.entities.WebLead.filter({ status: 'nuevo' }, { sort: '-received_at', limit: 50 }),
      base44.entities.AssignmentRule.filter({ active: true }).catch(() => []),
    ]);
    setLeads(leadRes.items || []);
    setRules(Array.isArray(ruleRes) ? ruleRes : ruleRes.items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const convert = async (lead) => {
    setBusyId(lead.id);
    try {
      const assignee = lead.suggested_assignee || ruleForZone(lead.zone, rules)?.assignee || '';
      const client = await base44.entities.Client.create({
        name: lead.name,
        phone: lead.phone || '',
        email: lead.email || '',
        operation_interest: lead.operation || 'venta',
        search_zones: lead.zone || '',
        budget_max: lead.budget_max,
        property_types: lead.property_types || [],
        assigned_to: assignee,
        notes: [lead.notes, lead.source ? `Alta desde el formulario web (${lead.source})` : '']
          .filter(Boolean)
          .join('\n\n'),
      });
      await base44.entities.WebLead.update(lead.id, { status: 'convertido', client_id: client.id });
      setLeads((list) => list.filter((item) => item.id !== lead.id));
      toast({ title: 'Cliente creado', description: `${lead.name} ya está en la cartera` });
      onConverted?.();
    } catch (error) {
      toast({ title: 'No se pudo crear el cliente', description: error.message, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const discard = async (lead) => {
    setBusyId(lead.id);
    try {
      await base44.entities.WebLead.update(lead.id, { status: 'descartado' });
      setLeads((list) => list.filter((item) => item.id !== lead.id));
    } finally {
      setBusyId(null);
    }
  };

  if (loading || leads.length === 0) return null;

  return (
    <div className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-amber-600" />
          <h2 className="font-heading text-sm font-bold">Leads web pendientes de revisión</h2>
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
            {leads.length}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">Revísalos y decide si pasan a la cartera</span>
      </div>

      <div className="mt-3 space-y-2">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{lead.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[lead.phone, lead.email].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {[
                  lead.zone,
                  OPERATION_LABELS[lead.operation] || null,
                  lead.budget_max ? formatCurrency(lead.budget_max, true) : null,
                  lead.suggested_assignee ? `Sugerido: ${lead.suggested_assignee}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {lead.notes && <p className="mt-1 line-clamp-2 text-xs italic text-muted-foreground">"{lead.notes}"</p>}
            </div>
            <div className="flex flex-none items-center gap-2">
              <span className="hidden text-[11px] text-muted-foreground sm:inline">
                {lead.received_at ? moment(lead.received_at).format('DD/MM HH:mm') : ''}
              </span>
              <Button size="sm" onClick={() => convert(lead)} disabled={busyId === lead.id}>
                {busyId === lead.id ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                )}
                Crear cliente
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => discard(lead)}
                disabled={busyId === lead.id}
                aria-label="Descartar lead"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}