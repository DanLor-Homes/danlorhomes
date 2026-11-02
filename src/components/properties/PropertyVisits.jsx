import React, { useEffect, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatDateTime } from '@/lib/crm';
import { VISIT_RESULT_CLASSES, visitResultLabel } from '@/lib/visits';
import { cn } from '@/lib/utils';

export default function PropertyVisits({ propertyId, clients = [] }) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) return undefined;
    let active = true;
    setLoading(true);
    base44.entities.Interaction.filter({ property_id: propertyId, type: 'visita' }, { sort: '-date', limit: 20 })
      .then((res) => {
        if (active) setVisits(res.items || []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [propertyId]);

  const nameOf = (clientId) => clients.find((client) => client.id === clientId)?.name || 'Visita';

  if (loading) {
    return (
      <div className="flex justify-center py-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (visits.length === 0) {
    return <p className="text-[11px] text-muted-foreground">Todavía no hay visitas registradas a este inmueble.</p>;
  }

  return (
    <ol className="space-y-1.5">
      {visits.map((visit) => (
        <li key={visit.id} className="rounded-lg border border-border/70 bg-card px-2.5 py-2">
          <div className="flex items-center justify-between gap-2">
            <p className="flex min-w-0 items-center gap-1.5 truncate text-[11px] font-medium">
              <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
              {nameOf(visit.client_id)}
            </p>
            <span
              className={cn(
                'shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium',
                VISIT_RESULT_CLASSES[visit.result] || VISIT_RESULT_CLASSES.pendiente
              )}
            >
              {visitResultLabel(visit.result)}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">{formatDateTime(visit.date)}</p>
          {visit.content && <p className="mt-1 whitespace-pre-wrap text-xs leading-snug">{visit.content}</p>}
        </li>
      ))}
    </ol>
  );
}