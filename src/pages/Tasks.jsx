import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ListChecks, Loader2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/crm/PageHeader';
import EmptyState from '@/components/crm/EmptyState';
import TaskDialog from '@/components/tasks/TaskDialog';
import TaskRow from '@/components/tasks/TaskRow';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DragDropContext } from '@hello-pangea/dnd';
import DragStatusDock from '@/components/drag/DragStatusDock';
import DragList from '@/components/drag/DragList';
import DraggableItem from '@/components/drag/DraggableItem';
import useStatusDragDrop from '@/hooks/useStatusDragDrop';
import { todayISO } from '@/lib/crm';
import { sortByPriority, taskPriority } from '@/lib/taskPriority';
import { TASK_CATEGORIES } from '@/lib/taskCategory';
import { cn } from '@/lib/utils';

const FILTERS = [
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'hoy', label: 'Hoy' },
  { id: 'completada', label: 'Completadas' },
  { id: 'todas', label: 'Todas' },
];

const TASK_STATUSES = [
  { id: 'pendiente', label: 'Pendiente' },
  { id: 'completada', label: 'Completada' },
];

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pendiente');
  const [category, setCategory] = useState('todas');
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
    if (category !== 'todas') {
      list = list.filter(({ task }) => (task.category || 'seguimiento') === category);
    }
    return sortByPriority(list);
  }, [tasks, filter, category, oppById]);

  const sections = useMemo(() => {
    if (filter === 'completada' || filter === 'todas') {
      return [{ id: 'todas', label: null, items: visible }];
    }
    const immediate = visible.filter(({ priority }) => priority.level === 'urgente' || priority.level === 'alta');
    const routine = visible.filter(({ priority }) => priority.level !== 'urgente' && priority.level !== 'alta');
    return [
      { id: 'inmediata', label: 'Atención inmediata', tone: 'text-rose-500', items: immediate },
      { id: 'rutinaria', label: 'Rutinarias', tone: 'text-muted-foreground', items: routine },
    ].filter((section) => section.items.length > 0);
  }, [visible, filter]);

  const toggle = async (task) => {
    const status = task.status === 'pendiente' ? 'completada' : 'pendiente';
    setTasks((list) => list.map((t) => (t.id === task.id ? { ...t, status } : t)));
    await base44.entities.CommercialTask.update(task.id, { status });
  };

  const remove = async (task) => {
    setTasks((list) => list.filter((t) => t.id !== task.id));
    await base44.entities.CommercialTask.delete(task.id);
  };

  const drag = useStatusDragDrop({
    onMove: async (id, status) => {
      const task = tasks.find((item) => item.id === id);
      if (!task || task.status === status) return;
      setTasks((list) => list.map((item) => (item.id === id ? { ...item, status } : item)));
      await base44.entities.CommercialTask.update(id, { status });
    },
    onTrash: (id) => {
      const task = tasks.find((item) => item.id === id);
      if (task) remove(task);
    },
  });

  const taskIndex = useMemo(() => new Map(visible.map((item, i) => [item.task.id, i])), [visible]);

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

      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Categoría</span>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-8 w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            {TASK_CATEGORIES.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <DragDropContext onDragStart={drag.handleDragStart} onDragEnd={drag.handleDragEnd}>
          <DragStatusDock
            statuses={TASK_STATUSES}
            dragging={drag.dragging}
            hint="Arrastra una tarea para completarla o eliminarla"
          />
          <DragList className="space-y-5">
          {sections.map((section) => (
            <div key={section.id}>
              {section.label && (
                <div className="mb-2 flex items-center gap-2">
                  <h3 className={cn('text-[11px] font-semibold uppercase tracking-[0.14em]', section.tone)}>{section.label}</h3>
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {section.items.length}
                  </span>
                </div>
              )}
              <div className="space-y-2">
                {section.items.map(({ task, priority }) => (
                  <DraggableItem key={task.id} id={task.id} index={taskIndex.get(task.id) ?? 0}>
                    <TaskRow
                      task={task}
                      priority={priority}
                      opportunityName={oppMap[task.opportunity_id]}
                      clientName={clientMap[task.client_id]}
                      onToggle={() => toggle(task)}
                      onEdit={() => {
                        setEditing(task);
                        setDialogOpen(true);
                      }}
                      onDelete={() => remove(task)}
                    />
                  </DraggableItem>
                ))}
              </div>
            </div>
          ))}
          </DragList>
        </DragDropContext>
      )}

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} task={editing} opportunities={opportunities} onSaved={load} />
    </div>
  );
}