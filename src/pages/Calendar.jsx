import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Plus, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/crm/PageHeader';
import InteractionDialog from '@/components/interactions/InteractionDialog';
import { Button } from '@/components/ui/button';
import { INTERACTION_LABELS } from '@/lib/crm';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const dayKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const isoDayKey = (iso) => dayKey(new Date(iso));

const TYPE_STYLES = {
  reunion: 'bg-primary/15 text-primary border-primary/25',
  visita: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
  llamada: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  email: 'bg-sky-500/15 text-sky-300 border-sky-500/25',
  whatsapp: 'bg-teal-500/15 text-teal-300 border-teal-500/25',
  nota: 'bg-muted text-muted-foreground border-border',
};

export default function CalendarPage() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [interactions, setInteractions] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    const [interactionRes, clientRes] = await Promise.all([
      base44.entities.Interaction.filter({}, { sort: 'date', limit: 500 }),
      base44.entities.Client.filter({}, { sort: 'name', limit: 500 }),
    ]);
    setInteractions(interactionRes.items || []);
    setClients(clientRes.items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const clientMap = useMemo(
    () => clients.reduce((acc, client) => ({ ...acc, [client.id]: client.name }), {}),
    [clients]
  );

  const byDay = useMemo(() => {
    const map = {};
    interactions.forEach((item) => {
      if (!item.date) return;
      const key = isoDayKey(item.date);
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    Object.values(map).forEach((list) => list.sort((a, b) => String(a.date).localeCompare(String(b.date))));
    return map;
  }, [interactions]);

  const cells = useMemo(() => {
    const startWeekday = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const list = [];
    for (let i = 0; i < startWeekday; i += 1) list.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) {
      list.push(new Date(month.getFullYear(), month.getMonth(), d));
    }
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [month]);

  const monthLabel = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(month);
  const todayKey = dayKey(new Date());

  const shiftMonth = (delta) => setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));

  const openDay = (date) => {
    setSelectedDate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 0));
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

  const monthEvents = interactions.filter((item) => {
    if (!item.date) return false;
    const date = new Date(item.date);
    return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
  }).length;

  return (
    <div>
      <PageHeader
        eyebrow="Agenda"
        title="Calendario"
        description={`${monthEvents} eventos este mes entre reuniones, visitas y llamadas.`}
      >
        <Button variant="outline" onClick={syncCalendar} disabled={syncing}>
          {syncing ? <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
          Sincronizar Google Calendar
        </Button>
        <Button onClick={() => { setSelectedDate(new Date()); setDialogOpen(true); }}>
          <Plus className="mr-1.5 h-4 w-4" /> Nueva interacción
        </Button>
      </PageHeader>

      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => shiftMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="w-44 text-center font-heading text-sm font-bold capitalize">{monthLabel}</h3>
          <Button variant="ghost" size="icon" onClick={() => shiftMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const now = new Date();
            setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
          }}
        >
          Hoy
        </Button>
      </div>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
          <div className="grid grid-cols-7 border-b border-border/70 bg-muted/30">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((date, index) => {
              if (!date) return <div key={`empty-${index}`} className="min-h-[92px] border-b border-r border-border/40 bg-muted/10 sm:min-h-[112px]" />;
              const key = dayKey(date);
              const events = byDay[key] || [];
              const isToday = key === todayKey;
              return (
                <button
                  key={key}
                  onClick={() => openDay(date)}
                  className={cn(
                    'min-h-[92px] border-b border-r border-border/40 p-1.5 text-left align-top transition-colors hover:bg-accent/40 sm:min-h-[112px] sm:p-2',
                    isToday && 'bg-primary/5'
                  )}
                >
                  <span
                    className={cn(
                      'mb-1 inline-grid h-5 w-5 place-items-center rounded-full text-[11px] font-semibold',
                      isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {date.getDate()}
                  </span>
                  <div className="space-y-0.5">
                    {events.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        title={`${INTERACTION_LABELS[event.type]} · ${clientMap[event.client_id] || ''}`}
                        className={cn('truncate rounded border px-1 py-0.5 text-[9px] font-medium leading-tight', TYPE_STYLES[event.type] || TYPE_STYLES.nota)}
                      >
                        {clientMap[event.client_id] || INTERACTION_LABELS[event.type]}
                      </div>
                    ))}
                    {events.length > 2 && (
                      <p className="px-1 text-[9px] font-medium text-muted-foreground">+{events.length - 2} más</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
        {['reunion', 'visita', 'llamada', 'email'].map((type) => (
          <span key={type} className="flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full border', TYPE_STYLES[type])} />
            {INTERACTION_LABELS[type]}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-1">
          <CalendarDays className="h-3 w-3" /> Haz clic en un día para registrar una interacción
        </span>
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