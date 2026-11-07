import React from 'react';
import { GripVertical, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { CHANNEL_LABELS, formatCurrency } from '@/lib/crm';

export default function ChannelCard({ channel, stats, onToggle, onRemove }) {
  return (
    <div className="card-surface h-full p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1 font-heading text-sm font-bold">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate">{CHANNEL_LABELS[channel.name] || channel.name}</span>
          </p>
          <p className="text-[11px] text-muted-foreground">
            {stats.count} oportunidades · {formatCurrency(stats.value)}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Switch checked={Boolean(channel.active)} onCheckedChange={() => onToggle(channel)} />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(channel)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="mt-3 border-t border-border/60 pt-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ganado</p>
        <p className="font-heading text-lg font-bold text-emerald-400">{formatCurrency(stats.won)}</p>
      </div>
    </div>
  );
}