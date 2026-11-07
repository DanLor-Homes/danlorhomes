import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/crm/PageHeader';
import StatCard from '@/components/crm/StatCard';
import InteractionDialog from '@/components/interactions/InteractionDialog';
import CalendarGrid from '@/components/calendar/CalendarGrid';
import DayAgenda from '@/components/calendar/DayAgenda';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { INTERACTION_LABELS } from '@/lib/crm';
import { dayKey, eventStyle, formatTime, groupByDay, isoDayKey, monthCells } from '@/lib/calendar';

const LEGEND = ['reunion', 'visita', 'llamada', 'email', 'tarea'];

export default function CalendarPage() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [interactions, setInteractions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    const [interactionRes, clientRes, taskRes] = await Promise.all([
      base44.entities.Interaction.filter({}, { sort: 'date', limit: 500 }),
      base44.entities.Client.filter({}, { sort: 'name', limit: 500 }),
      base44.entities.CommercialTask.filter({}, { sort: 'due_date', limit: 300 }),
    ]);
    setInteractions(interactionRes.items || []);
    setClients(clientRes.items || []);
    setTasks(taskRes.items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const clientMap = useMemo(
    () => clients.reduce((acc, client) => ({ ...acc, [client.id]: client.name }), {}),
    [clients]
  );

  const events = useMemo(() => {
    const interactionEvents = interactions
      .filter((item) => item.date)
      .map((item) => ({
        id: `interaction-${item.id}`,
        day: isoDayKey(item.date),
        time: item.date,
        sortKey: item.date,
        type: item.type,
        title: clientMap[item.client_id] || INTERACTION_LABELS[item.type] || item.type,
        subtitle: INTERACTION_LABELS[item.type] || 'Interacción',
        detail: item.content,
      }));

    const taskEvents = tasks
      .filter((task) => task.due_date)
      .map((task) => ({
        id: `task-${task.id}`,
        day: isoDayKey(task.due_date),
        time: null,
        sortKey: `${String(task.due_date).slice(0, 10)}T00:00`,
        type: 'tarea',
        title: task.title,
        subtitle: 'Tarea',
        detail: task.status === 'completada' ? 'Tarea completada' : 'Tarea pendiente',
        done: task.status === 'completada',
      }));

    return [...interactionEvents, ...taskEvents].sort((a, b) => String(a.sortKey).localeCompare(String(b.sortKey)));
  }, [interactions, tasks, clientMap]);

  const eventsByDay = useMemo(() => groupByDay(events), [events]);
  const cells = useMemo(() => monthCells(month), [month]);

  const todayKey = dayKey(new Date());
  const selectedKey = dayKey(selectedDate);
  const selectedEvents = eventsByDay[selectedKey] || [];

  const monthEvents = events.filter((event) => {
    const date = new Date(event.sortKey);
    return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
  }).length;

  const todayEvents = eventsByDay[todayKey] || [];
  const now = Date.now();
  const nextToday = todayEvents.find((event) => event.time && new Date(event.time).getTime() >= now);

  const nextSevenDays = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return events.filter((event) => {
      const date = new Date(event.sortKey);
      return date >= start && date < end;
    }).length;
  }, [events]);

  const monthLabel = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(month);

  const shiftMonth = (delta) => setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));

  const goToToday = () => {
    const nowDate = new Date();
    setMonth(new Date(nowDate.getFullYear(), nowDate.getMonth(), 1));
    setSelectedDate(nowDate);
  };

  const selectDay = (date) => {
    setSelectedDate(date);
    if (date.getMonth() !== month.getMonth() || date.getFullYear() !== month.getFullYear()) {
      setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  };

  const addToSelectedDay = () => {
    const target = new Date(selectedDate);
    target.setHours(10, 0, 0, 0);
    setSelectedDate(target);
    setDialogOpen(true);
  };

  const syncCalendar = async () => {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke('googleCalendarEvents', { days: 30 });
      toast({
        title: 'Google Calendar sincronizado',
        description: `${res.data?.synced ?? 0} eventos importados · ${res.data?.skipped ?? 0} sin cliente asociado`,
      });
      await load();
    } catch (error) {
      toast({
        title: 'No se pudo sincronizar',
        description: 'Conecta tu cuenta de Google desde Ajustes y vuelve a intentarlo.',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Agenda"
        title="Calendario"
        description="Reuniones, visitas, llamadas y tareas con vencimiento en una sola vista."
      >
        <Button variant="outline" onClick={syncCalendar} disabled={syncing}>
          <RefreshCw className={cn('mr-1.5 h-4 w-4', syncing && 'animate-spin')} />
          Sincronizar Google Calendar
        </Button>
        <Button onClick={addToSelectedDay}>
          <Plus className="mr-1.5 h-4 w-4" /> Nueva interacción
        </Button>
      </PageHeader>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Eventos del mes" value={monthEvents} icon={CalendarDays} tone="primary" hint="Incluye tareas con vencimiento" />
        <StatCard
          label="Hoy"
          value={todayEvents.length}
          icon={Clock}
          tone="emerald"
          hint={nextToday ? `Siguiente a las ${formatTime(nextToday.time)}` : 'Sin eventos pendientes'}
        />
        <StatCard label="Próximos 7 días" value={nextSevenDays} icon={CalendarClock} tone="violet" hint="Agenda a corto plazo" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_322px]">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => shiftMonth(-1)} aria-label="Mes anterior">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="w-40 text-center font-heading text-sm font-bold capitalize">{monthLabel}</h3>
              <Button variant="ghost" size="icon" onClick={() => shiftMonth(1)} aria-label="Mes siguiente">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="ml-1 h-8" onClick={goToToday}>
                Hoy
              </Button>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              {monthEvents} {monthEvents === 1 ? 'evento' : 'eventos'}
            </span>
          </div>

          <CalendarGrid
            cells={cells}
            eventsByDay={eventsByDay}
            selectedKey={selectedKey}
            todayKey={todayKey}
            onSelect={selectDay}
          />

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10.5px] text-muted-foreground">
            {LEGEND.map((type) => (
              <span key={type} className="flex items-center gap-1.5">
                <span className={cn('h-2 w-2 rounded-full', eventStyle(type).dot)} />
                {type === 'tarea' ? 'Tarea' : INTERACTION_LABELS[type]}
              </span>
            ))}
            <span className="ml-auto hidden sm:inline">Haz clic en un día para ver su agenda</span>
          </div>
        </div>

        <DayAgenda date={selectedDate} events={selectedEvents} onAdd={addToSelectedDay} />
      </div>

      <InteractionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clients={clients}
        defaultDate={selectedDate ? selectedDate.toISOString() : undefined}
        onSaved={load}
      />
    </div>
  );
}