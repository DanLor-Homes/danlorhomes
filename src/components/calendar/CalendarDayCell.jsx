import React from 'react';
import { cn } from '@/lib/utils';
import { eventStyle, formatTime } from '@/lib/calendar';

export default function CalendarDayCell({ date, outside, events, isToday, isSelected, onSelect }) {
  const visible = events.slice(0, 3);

  return (
    <button
      type="button"
      onClick={() => onSelect(date)}
      className={cn(
        'flex min-h-[104px] flex-col gap-1 border-b border-r border-border/50 p-1.5 text-left transition-colors sm:min-h-[118px] sm:p-2',
        outside ? 'bg-muted/20' : 'hover:bg-accent/30',
        isSelected && 'bg-primary/[0.06] ring-1 ring-inset ring-primary/40'
      )}
    >
      <span
        className={cn(
          'grid h-6 w-6 flex-none place-items-center rounded-full text-[11px] font-semibold tabular-nums',
          isToday && 'bg-primary text-primary-foreground',
          !isToday && (outside ? 'text-muted-foreground/50' : 'text-foreground/80'),
          !isToday && isSelected && 'bg-primary/10 text-primary'
        )}
      >
        {date.getDate()}
      </span>

      <div className="flex min-w-0 flex-col gap-[3px]">
        {visible.map((event) => {
          const style = eventStyle(event.type);
          return (
            <div
              key={event.id}
              title={`${event.subtitle}${event.title ? ` · ${event.title}` : ''}`}
              className={cn(
                'flex min-w-0 items-center gap-1 rounded border px-1 py-[2px] text-[9.5px] font-medium leading-tight',
                style.chip,
                event.done && 'opacity-55'
              )}
            >
              <span className={cn('h-1.5 w-1.5 flex-none rounded-full', style.dot)} />
              {event.time && (
                <span className="flex-none tabular-nums opacity-75">{formatTime(event.time)}</span>
              )}
              <span className={cn('truncate', event.done && 'line-through')}>{event.title}</span>
            </div>
          );
        })}
        {events.length > visible.length && (
          <span className="pl-1 text-[9px] font-semibold text-muted-foreground">
            +{events.length - visible.length} más
          </span>
        )}
      </div>
    </button>
  );
}