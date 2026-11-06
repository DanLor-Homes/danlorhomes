import React from 'react';
import { CheckCircle2, Circle, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PriorityBadge from '@/components/tasks/PriorityBadge';
import TaskCategoryBadge from '@/components/tasks/TaskCategoryBadge';
import { formatDate, todayISO } from '@/lib/crm';
import { cn } from '@/lib/utils';

export default function TaskRow({ task, priority, opportunityName, clientName, onToggle, onEdit, onDelete }) {
  const overdue = task.status === 'pendiente' && task.due_date && task.due_date < todayISO();

  return (
    <div
      className={cn(
        'group flex items-start gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary/30',
        priority.level === 'urgente' ? 'border-rose-500/30' : 'border-border/70'
      )}
    >
      <button onClick={onToggle} className="mt-0.5 text-muted-foreground transition-colors hover:text-primary">
        {task.status === 'pendiente' ? <Circle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <PriorityBadge level={priority.level} />
          <TaskCategoryBadge category={task.category} />
          <p className={cn('text-sm font-medium leading-snug', task.status === 'completada' && 'text-muted-foreground line-through')}>
            {task.title}
          </p>
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
          <span className={overdue ? 'text-rose-400' : ''}>
            {overdue ? 'Vencida · ' : ''}
            {formatDate(task.due_date)}
          </span>
          {task.opportunity_id && <span>· {opportunityName || 'Oportunidad'}</span>}
          {task.client_id && <span>· {clientName || 'Cliente'}</span>}
          {task.assignee && <span>· {task.assignee}</span>}
          {task.auto_generated && (
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Auto</span>
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}