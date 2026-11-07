import React, { useMemo } from 'react';
import { CalendarRange, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/calendar';
import { VISIT_RESULT_CLASSES, visitResultLabel } from '@/lib/visits';

const formatDay = (day) =>
  new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(
    new Date(`${day}T12:00:00`)
  );

export default function VisitAgendaDialog({ open, onOpenChange, visits }) {
  const groups = useMemo(() => {
    const map = new Map();
    visits.forEach((visit) => {
      if (!map.has(visit.day)) map.set(visit.day, []);
      map.get(visit.day).push(visit);
    });
    return [...map.entries()];
  }, [visits]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <CalendarRange className="h-4 w-4 text-primary" /> Agenda de visitas programadas
          </DialogTitle>
          <DialogDescription>Visitas a inmuebles pendientes desde hoy, ordenadas por fecha.</DialogDescription>
        </DialogHeader>

        {groups.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No hay visitas programadas.</p>
        ) : (
          <div className="space-y-4">
            {groups.map(([day, list]) => (
              <div key={day}>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground capitalize">
                  {formatDay(day)}
                </p>
                <div className="space-y-1.5">
                  {list.map((visit) => (
                    <div key={visit.id} className="rounded-xl border border-border/70 bg-card px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{visit.title}</p>
                        <span className="flex-none text-[11px] font-semibold tabular-nums text-primary">
                          {visit.time ? formatTime(visit.time) : 'Sin hora'}
                        </span>
                      </div>
                      {visit.property && (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{visit.property}</span>
                        </p>
                      )}
                      {visit.detail && (
                        <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">{visit.detail}</p>
                      )}
                      <span
                        className={cn(
                          'mt-1.5 inline-block rounded-full border px-1.5 py-0.5 text-[10px] font-medium',
                          VISIT_RESULT_CLASSES[visit.result] || VISIT_RESULT_CLASSES.pendiente
                        )}
                      >
                        {visitResultLabel(visit.result)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}