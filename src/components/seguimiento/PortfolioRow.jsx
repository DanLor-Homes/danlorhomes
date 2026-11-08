import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/crm';
import { daysSince, portfolioHint } from '@/lib/followUp';
import { operationLabel, pricePerM2, propertyStatusLabel } from '@/lib/properties';
import { cn } from '@/lib/utils';

const TONE = {
  rose: 'text-rose-600 dark:text-rose-300',
  amber: 'text-amber-600 dark:text-amber-300',
  ok: 'text-emerald-600 dark:text-emerald-300',
  muted: 'text-muted-foreground',
};

export default function PortfolioRow({ property, visits, lastVisit, onFollowUp }) {
  const daysOnMarket = daysSince(property.published_date || property.capture_date || property.created_date);
  const lastVisitDays = daysSince(lastVisit);
  const hint = portfolioHint(property, { visits, lastVisitDays, daysOnMarket });
  const perM2 = property.price && property.surface ? Math.round(pricePerM2(property.price, property.surface)) : null;

  return (
    <article className="card-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="rounded-md bg-muted px-1.5 py-0.5">{propertyStatusLabel(property.status)}</span>
          <span>{operationLabel(property.operation)}</span>
          {property.exclusive && <span className="text-primary">Exclusiva</span>}
        </div>
        <p className="mt-1 truncate font-heading text-sm font-semibold">{property.title}</p>
        <p className="text-xs text-muted-foreground">
          {[
            property.zone || property.municipality,
            property.price ? formatCurrency(property.price) : null,
            property.surface ? `${property.surface} m²` : null,
            perM2 ? `${perM2.toLocaleString('es-ES')} €/m²` : null,
            daysOnMarket !== null ? `${daysOnMarket} días en cartera` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <p className={cn('mt-1.5 text-[11px] font-medium', TONE[hint.tone])}>{hint.text}</p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="outline" asChild>
          <Link to={`/inmuebles/${property.id}/ficha`}>
            <FileText className="h-3.5 w-3.5" /> Ficha
          </Link>
        </Button>
        <Button size="sm" onClick={() => onFollowUp(property)}>
          <CalendarPlus className="h-3.5 w-3.5" /> Crear tarea
        </Button>
      </div>
    </article>
  );
}