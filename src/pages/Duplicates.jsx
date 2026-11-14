import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Info, Loader2, Users2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/crm/PageHeader';
import StatCard from '@/components/crm/StatCard';
import EmptyState from '@/components/crm/EmptyState';
import DuplicateGroupCard from '@/components/duplicates/DuplicateGroupCard';
import { CLIENT_DUPLICATE_SPECS, LEAD_DUPLICATE_SPECS, findDuplicates } from '@/lib/duplicates';
import { statusMeta } from '@/lib/clientStatus';

const LEAD_STATUS = {
  nuevo: { label: 'Nuevo', className: 'bg-amber-500/15 text-amber-500' },
  convertido: { label: 'Convertido', className: 'bg-emerald-500/15 text-emerald-500' },
  descartado: { label: 'Descartado', className: 'bg-muted text-muted-foreground' },
};

const join = (...parts) => parts.filter(Boolean).join(' · ');

function Section({ title, description, groups, recordsById, to, entity, onMerged }) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
          {groups.length} {groups.length === 1 ? 'grupo' : 'grupos'}
        </span>
      </div>

      {groups.length === 0 ? (
        <EmptyState icon={Users2} title="Sin posibles duplicados" description="No se han detectado fichas repetidas." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {groups.map((group) => (
            <DuplicateGroupCard
              key={group.id}
              reasons={group.reasons}
              to={to}
              entity={entity}
              onMerged={onMerged}
              records={group.records.map((record) => recordsById[record.id]).filter(Boolean)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function Duplicates() {
  const [clients, setClients] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [clientPage, leadPage] = await Promise.all([
      base44.entities.Client.list({ sort: '-created_date', limit: 1000 }),
      base44.entities.WebLead.list({ sort: '-created_date', limit: 1000 }),
    ]);
    setClients(clientPage.items || []);
    setLeads(leadPage.items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const clientGroups = useMemo(() => findDuplicates(clients, CLIENT_DUPLICATE_SPECS), [clients]);
  const leadGroups = useMemo(() => findDuplicates(leads, LEAD_DUPLICATE_SPECS), [leads]);

  const clientRecords = useMemo(
    () =>
      clients.reduce((acc, client) => {
        const status = statusMeta(client.status);
        acc[client.id] = {
          id: client.id,
          raw: client,
          name: client.name || 'Sin nombre',
          meta: join(client.phone, client.email, client.assigned_to),
          badge: { label: status.label, className: status.className },
        };
        return acc;
      }, {}),
    [clients]
  );

  const leadRecords = useMemo(
    () =>
      leads.reduce((acc, lead) => {
        const status = LEAD_STATUS[lead.status] || LEAD_STATUS.nuevo;
        acc[lead.id] = {
          id: lead.id,
          raw: lead,
          name: lead.name || 'Sin nombre',
          meta: join(lead.phone, lead.email, lead.zone, lead.source),
          badge: status,
        };
        return acc;
      }, {}),
    [leads]
  );

  const affectedClients = clientGroups.reduce((total, group) => total + group.records.length, 0);
  const affectedLeads = leadGroups.reduce((total, group) => total + group.records.length, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Calidad de datos"
        title="Posibles duplicados"
        description="Fichas que comparten email, teléfono o nombre. Selecciona las repetidas, elige cuál conservar y fusiónalas en un paso."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Grupos de clientes" value={clientGroups.length} hint="Fichas repetidas" icon={AlertTriangle} />
        <StatCard label="Grupos de leads web" value={leadGroups.length} hint="Formularios repetidos" icon={AlertTriangle} />
        <StatCard
          label="Fichas afectadas"
          value={affectedClients + affectedLeads}
          hint="Listas para fusionar"
          icon={Users2}
        />
      </div>

      <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          Las coincidencias por nombre pueden ser personas distintas. Marca las fichas repetidas y pulsa «Fusionar»: la
          ficha que elijas conservará sus datos completos, sus registros vinculados y las demás se eliminarán.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Revisando fichas…
        </div>
      ) : (
        <>
          <Section
            title="Clientes y leads del CRM"
            description="Fichas de cliente con datos coincidentes."
            groups={clientGroups}
            recordsById={clientRecords}
            to="/leads"
            entity="Client"
            onMerged={load}
          />
          <Section
            title="Leads web"
            description="Solicitudes recibidas desde formularios y landings."
            groups={leadGroups}
            recordsById={leadRecords}
            to="/leads"
            entity="WebLead"
            onMerged={load}
          />
        </>
      )}
    </div>
  );
}