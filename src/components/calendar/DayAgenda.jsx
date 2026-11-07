import React from 'react';
import { CalendarDays, CalendarPlus, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { eventStyle, formatTime, typeLabel } from '@/lib/calendar';

export default function DayAgenda({ date, events, onAdd }) {
  const heading = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);

  return (
    <section className="card-surface flex h-full flex-col overflow-hidden">
      <header className="border-b border-border/70 bg-muted/30 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Agenda del día</p>
        <h3 className="mt-0.5 font-heading text-base font-bold capitalize leading-snug">{heading}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {events.length === 0
            ? 'Sin eventos registrados'
            : `${events.length} ${events.length === 1 ? 'evento' : 'eventos'}`}
        </p>
      </header>

      <div className="max-h-[46vh] flex-1 overflow-y-auto divide-y divide-border/50 xl:max-h-none">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-5 py-12 text-center">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
            </span>
            <p className="text-xs text-muted-foreground">Día libre. Aprovecha para agendar una visita o llamada.</p>
          </div>
        ) : (
          events.map((event) => {
            const style = eventStyle(event.type);
            return (
              <div key={event.id} className="flex gap-3 px-4 py-3">
                <p className="w-11 flex-none pt-0.5 text-right text-[11px] font-semibold tabular-nums text-muted-foreground">
                  {event.time ? formatTime(event.time) : '—'}
                </p>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('h-1.5 w-1.5 flex-none rounded-full', style.dot)} />
                    <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {typeLabel(event.type)}
                    </span>
                  </div>
                  <p className={cn('mt-0.5 truncate text-sm font-semibold', event.done && 'text-muted-foreground line-through')}>
                    {event.title}
                  </p>
                  {event.property && (
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3 flex-none" />
                      <span className="truncate">{event.property}</span>
                    </p>
                  )}
                  {event.detail && (
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{event.detail}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-border/70 p-3">
        <Button size="sm" className="w-full" onClick={onAdd}>
          <CalendarPlus className="mr-1.5 h-4 w-4" /> Añadir a este día
        </Button>
      </div>
    </section>
  );
}