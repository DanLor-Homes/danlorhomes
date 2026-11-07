import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Building2, CalendarClock, Clock, Eraser, Flame } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { buildSalesAlerts, closingLabel } from '@/lib/salesAlerts';
import { portalLabel } from '@/lib/portals';
import { daysSince, formatCurrency, formatDate, stageLabel } from '@/lib/crm';
import { scoreLead } from '@/lib/leadScoring';

const HOT_STALE_DAYS = 30;
const CLEARED_KEY = 'danlor_cleared_alerts';

const readCleared = () => {
  try {
    return JSON.parse(localStorage.getItem(CLEARED_KEY) || '{}') || {};
  } catch {
    return {};
  }
};

export default function NotificationsBell() {
  const [alerts, setAlerts] = useState({ stalled: [], closingSoon: [], total: 0 });
  const [listings, setListings] = useState([]);
  const [staleLeads, setStaleLeads] = useState([]);
  const [cleared, setCleared] = useState(readCleared);

  useEffect(() => {
    let active = true;
    Promise.all([
      base44.entities.Opportunity.filter({ archived: false }, { sort: '-updated_date', limit: 500 }),
      base44.entities.PortalListing.filter({ status: 'nuevo' }, { sort: '-first_seen', limit: 30 }),
      base44.entities.Client.filter({}, { sort: 'name', limit: 500 }),
      base44.entities.Interaction.aggregate({ groupBy: 'client_id', max: ['date'] }),
    ])
      .then(([oppPage, listingPage, clientPage, interactionAgg]) => {
        if (!active) return;
        const opportunities = oppPage.items || [];

        const activityMap = {};
        (interactionAgg.rows || []).forEach((row) => {
          activityMap[row.client_id] = { count: row.count || 0, last: row.max_date || row.date_max || null };
        });

        const openByClient = {};
        opportunities.forEach((o) => {
          if (o.status !== 'open') return;
          const entry = openByClient[o.client_id] || { count: 0, value: 0 };
          entry.count += 1;
          entry.value += Number(o.amount) || 0;
          openByClient[o.client_id] = entry;
        });

        setAlerts(buildSalesAlerts(opportunities));
        setListings(listingPage.items || []);
        setStaleLeads(
          (clientPage.items || [])
            .map((client) => {
              const act = activityMap[client.id] || {};
              const opp = openByClient[client.id] || {};
              return {
                client,
                days: daysSince(act.last),
                ...scoreLead({
                  client,
                  interactionCount: act.count || 0,
                  lastInteraction: act.last || null,
                  openValue: opp.value || 0,
                  openCount: opp.count || 0,
                }),
              };
            })
            .filter((lead) => lead.band.id === 'hot' && (lead.days === null || lead.days > HOT_STALE_DAYS))
            .sort((a, b) => (b.days ?? 9999) - (a.days ?? 9999))
            .slice(0, 3)
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const visibleStaleLeads = staleLeads.filter(({ client }) => !cleared[`lead-${client.id}`]);
  const visibleListings = listings.filter((listing) => !cleared[`listing-${listing.id}`]);
  const visibleClosingSoon = alerts.closingSoon.filter(({ opportunity }) => !cleared[`close-${opportunity.id}`]);
  const visibleStalled = alerts.stalled.filter(({ opportunity }) => !cleared[`stall-${opportunity.id}`]);

  const total =
    visibleStaleLeads.length + visibleListings.length + visibleClosingSoon.length + visibleStalled.length;

  const clearAll = () => {
    const next = { ...cleared };
    staleLeads.forEach(({ client }) => {
      next[`lead-${client.id}`] = true;
    });
    listings.forEach((listing) => {
      next[`listing-${listing.id}`] = true;
    });
    alerts.closingSoon.forEach(({ opportunity }) => {
      next[`close-${opportunity.id}`] = true;
    });
    alerts.stalled.forEach(({ opportunity }) => {
      next[`stall-${opportunity.id}`] = true;
    });
    localStorage.setItem(CLEARED_KEY, JSON.stringify(next));
    setCleared(next);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Avisos de oportunidades">
          <Bell className="h-[18px] w-[18px]" />
          {total > 0 && (
            <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
              {total > 9 ? '9+' : total}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border/70 px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold">Avisos automáticos</p>
            {total > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
              >
                <Eraser className="h-3.5 w-3.5" /> Limpiar
              </button>
            )}
          </div>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Inmuebles nuevos en portales, leads calientes sin contacto, etapas estancadas y cierres a menos de 3 días
          </p>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {total === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              Flujo al día: sin inmuebles nuevos, leads enfriados ni oportunidades bloqueadas.
            </p>
          ) : (
            <div className="space-y-1">
              {visibleStaleLeads.length > 0 && (
                <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                  Leads calientes sin contacto · {visibleStaleLeads.length}
                </p>
              )}
              {visibleStaleLeads.map(({ client, score, days }) => (
                <Link
                  key={`lead-${client.id}`}
                  to="/leads"
                  className="flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-accent/60"
                >
                  <Flame className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium">{client.name}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      Score {score} ·{' '}
                      {days === null ? 'sin interacciones registradas' : `último contacto hace ${days} días`}
                    </span>
                  </span>
                </Link>
              ))}
              {visibleListings.length > 0 && (
                <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                  Inmuebles nuevos · {visibleListings.length}
                </p>
              )}
              {visibleListings.slice(0, 4).map((listing) => (
                <Link
                  key={`listing-${listing.id}`}
                  to="/portales"
                  className="flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-accent/60"
                >
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium">{listing.title}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {portalLabel(listing.portal)}
                      {listing.price ? ` · ${formatCurrency(listing.price)}` : ''} ·{' '}
                      {listing.operation === 'alquiler' ? 'alquiler' : 'venta'}
                    </span>
                  </span>
                </Link>
              ))}
              {visibleClosingSoon.map(({ opportunity, remaining }) => (
                <Link
                  key={`close-${opportunity.id}`}
                  to="/pipeline"
                  className="flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-accent/60"
                >
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium">{opportunity.name}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      Cierre {formatDate(opportunity.expected_closing_date)} · {closingLabel(remaining)}
                    </span>
                  </span>
                </Link>
              ))}
              {visibleStalled.map(({ opportunity, days }) => (
                <Link
                  key={`stall-${opportunity.id}`}
                  to="/pipeline"
                  className="flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-accent/60"
                >
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium">{opportunity.name}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {days} días en «{stageLabel(opportunity.stage)}»
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}