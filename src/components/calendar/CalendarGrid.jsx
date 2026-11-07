import React from 'react';
import { WEEKDAYS, dayKey } from '@/lib/calendar';
import CalendarDayCell from '@/components/calendar/CalendarDayCell';

export default function CalendarGrid({ cells, eventsByDay, selectedKey, todayKey, onSelect }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="grid grid-cols-7 border-b border-border/70 bg-muted/40">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 [&>*:nth-child(7n)]:border-r-0">
        {cells.map(({ date, outside }) => {
          const key = dayKey(date);
          return (
            <CalendarDayCell
              key={key}
              date={date}
              outside={outside}
              events={eventsByDay[key] || []}
              isToday={key === todayKey}
              isSelected={key === selectedKey}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </div>
  );
}