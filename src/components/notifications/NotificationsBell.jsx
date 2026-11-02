import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Building2, CalendarClock, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { buildSalesAlerts, closingLabel } from '@/lib/salesAlerts';
import { portalLabel } from '@/lib/portals';
import { formatCurrency, formatDate, stageLabel } from '@/lib/crm';

export default function NotificationsBell() {
  const [alerts, setAlerts] = useState({ stalled: [], closingSoon: [], total: 0 });
  const [listings, setListings] = useState([]);

  useEffect(() => {
    let active = true;
    base44.entities.Opportunity.filter(
      { archived: false, status: 'open' },
      { sort: 'expected_closing_date', limit: 200 }
    )
      .then((page) => {
        if (active) setAlerts(buildSalesAlerts(page.items || []));
      })
      .catch(() => {});
    base44.entities.PortalListing.filter({ status: 'nuevo' }, { sort: '-first_seen', limit: 30 })
      .then((page) => {
        if (active) setListings(page.items || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const total = alerts.total + listings.length;

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
          <p className="text-sm font-semibold">Avisos automáticos</p>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Inmuebles nuevos en portales, etapas estancadas y cierres a menos de 3 días
          </p>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {total === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              Flujo al día: sin inmuebles nuevos ni oportunidades bloqueadas.
            </p>
          ) : (
            <div className="space-y-1">
              {listings.length > 0 && (
                <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                  Inmuebles nuevos · {listings.length}
                </p>
              )}
              {listings.slice(0, 4).map((listing) => (
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
              {alerts.closingSoon.map(({ opportunity, remaining }) => (
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
              {alerts.stalled.map(({ opportunity, days }) => (
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