import React, { useState } from 'react';
import { ListChecks, Loader2, Mail, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CLIENT_STATUSES } from '@/lib/clientStatus';

export default function BulkClientBar({ count, busy, onStatusChange, onAssignTask, onSendEmail, onClear }) {
  const [statusValue, setStatusValue] = useState('');

  return (
    <div className="sticky top-[68px] z-10 mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-primary/40 bg-card px-3 py-2 shadow-sm">
      <span className="text-xs font-semibold">{count} seleccionados</span>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={statusValue}
          onValueChange={(value) => {
            setStatusValue(value);
            onStatusChange(value);
          }}
          disabled={busy}
        >
          <SelectTrigger className="h-8 w-full text-xs sm:w-44">
            <SelectValue placeholder="Cambiar estado" />
          </SelectTrigger>
          <SelectContent>
            {CLIENT_STATUSES.map((status) => (
              <SelectItem key={status.id} value={status.id} className="text-xs">
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={onAssignTask} disabled={busy}>
          {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ListChecks className="mr-1.5 h-4 w-4" />}
          Asignar tarea
        </Button>
        <Button size="sm" variant="outline" onClick={onSendEmail} disabled={busy}>
          <Mail className="mr-1.5 h-4 w-4" /> Enviar email
        </Button>
      </div>
      <Button size="icon" variant="ghost" className="ml-auto h-7 w-7" onClick={onClear} aria-label="Limpiar selección">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}