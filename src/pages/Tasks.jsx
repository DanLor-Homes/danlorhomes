import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, ListChecks, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/crm/PageHeader';
import EmptyState from '@/components/crm/EmptyState';
import TaskDialog from '@/components/tasks/TaskDialog';
import PriorityBadge from '@/components/tasks/PriorityBadge';
import { Button } from '@/components/ui/button';
import { formatDate, todayISO } from '@/lib/crm';
import { sortByPriority, taskPriority } from '@/lib/taskPriority';
import { cn } from '@/lib/utils';

const FILTERS = [
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'hoy', label: 'Hoy' },
  { id: 'completada', label: 'Completadas' },
  { id: 'todas', label: 'Todas' },
];

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pendiente');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    const [taskRes, oppRes, clientRes] = await Promise.all([
      base44.entities.CommercialTask.filter({}, { sort: 'due_date', limit: 500 }),
      base44.entities.Opportunity.filter({ archived: false }, { sort: '-updated_date', limit: 500 }),
      base44.entities.Client.filter({}, { sort: 'name', limit: 500 }),
    ]);
    setTasks(taskRes.items || []);
    setOpportunities(oppRes.items || []);
    setClients(clientRes.items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const oppMap = useMemo(
    () => opportunities.reduce((acc, op) => ({ ...acc, [op.id]: op.name }), {}),
    [opportunities]
  );

  const oppById = useMemo(
    () => opportunities.reduce((acc, op) => ({ ...acc, [op.id]: op }), {}),
    [opportunities]
  );

  const clientMap = useMemo(
    () => clients.reduce((acc, client) => ({ ...acc, [client.id]: client.name }), {}),
    [clients]
  );

  const visible = useMemo(() => {
    const today = todayISO();
    const decorated = tasks.map((task) => ({
      task,
      priority: taskPriority(task, oppById[task.opportunity_id]),
    }));
    let list = decorated;
    if (filter === 'hoy') {
      list = decorated.filter(({ task }) => task.status === 'pendiente' && task.due_date && task.due_date <= today);
    } else if (filter !== 'todas') {
      list = decorated.filter(({ task }) => task.status === filter);
    }
    return sortByPriority(list);
  }, [tasks, filter, oppById]);

  const toggle = async (task) => {
    const status = task.status === 'pendiente' ? 'completada' : 'pendiente';
    setTasks((list) => list.map((t) => (t.id === task.id ? { ...t, status } : t)));
    await base44.entities.CommercialTask.update(task.id, { status });
  };

  const remove = async (task) => {
    setTasks((list) => list.filter((t) => t.id !== task.id));
    await base44.entities.CommercialTask.delete(task.id);
  };

  const counts = {
    pendiente: tasks.filter((t) => t.status === 'pendiente').length,
    completada: tasks.filter((t) => t.status === 'completada').length,
  };

  return (
    <div>
      <PageHeader
        eyebrow="Seguimiento"
        title="Tareas"
        description={`${counts.pendiente} pendientes · ${counts.completada} completadas`}
      >
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Nueva tarea
        </Button>
      </PageHeader>

      <div className="mb-4 inline-flex flex-wrap gap-1 rounded-xl border border-border/70 bg-card p-1">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              filter === item.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Sin tareas en esta vista"
          description="Crea una tarea manualmente o deja que la automatización genere seguimientos tras 7 días sin interacción."
          action={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Nueva tarea
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {visible.map(({ task, priority }) => {
            const overdue = task.status === 'pendiente' && task.due_date && task.due_date < todayISO();
            return (
              <div
                key={task.id}
                className={cn(
                  'group flex items-start gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary/30',
                  priority.level === 'urgente' ? 'border-rose-500/30' : 'border-border/70'
                )}
              >
                <button onClick={() => toggle(task)} className="mt-0.5 text-muted-foreground transition-colors hover:text-primary">
                  {task.status === 'pendiente' ? <Circle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <PriorityBadge level={priority.level} />
                    <p className={cn('text-sm font-medium leading-snug', task.status === 'completada' && 'text-muted-foreground line-through')}>
                      {task.title}
                    </p>
                  </div>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                    <span className={overdue ? 'text-rose-400' : ''}>
                      {overdue ? 'Vencida · ' : ''}
                      {formatDate(task.due_date)}
                    </span>
                    {task.opportunity_id && <span>· {oppMap[task.opportunity_id] || 'Oportunidad'}</span>}
                    {task.client_id && <span>· {clientMap[task.client_id] || 'Cliente'}</span>}
                    {task.assignee && <span>· {task.assignee}</span>}
                    {task.auto_generated && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Auto</span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setEditing(task);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => remove(task)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} task={editing} opportunities={opportunities} onSaved={load} />
    </div>
  );
}