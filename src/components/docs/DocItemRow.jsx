import React from 'react';
import { Eye, Paperclip } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DOC_STATUSES, docStatusMeta } from '@/lib/documents';
import { cn } from '@/lib/utils';

export default function DocItemRow({ item, onStatusChange, onNotesChange, onNotesSave, onUpload, uploading }) {
  const status = docStatusMeta(item.status);

  const openFile = async () => {
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: item.file_uri });
    window.open(signed_url, '_blank', 'noopener');
  };

  return (
    <div className="space-y-2 border-b border-border/60 py-3 last:border-0">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{item.label}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>{item.required ? 'Obligatorio' : 'Opcional'}</span>
            <span className={cn('rounded-full px-2 py-0.5 font-semibold', status.className)}>{status.label}</span>
            {item.file_name && <span className="truncate">· {item.file_name}</span>}
          </div>
        </div>

        <Select value={item.status || 'pendiente'} onValueChange={(value) => onStatusChange(item, value)}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOC_STATUSES.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-input px-2.5 py-1.5 text-xs font-medium hover:bg-accent">
          <Paperclip className="h-3.5 w-3.5" />
          {uploading ? 'Subiendo…' : 'Adjuntar'}
          <input
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUpload(item, file);
              event.target.value = '';
            }}
          />
        </label>

        {item.file_uri && (
          <Button type="button" size="sm" variant="ghost" onClick={openFile}>
            <Eye className="h-3.5 w-3.5" /> Ver
          </Button>
        )}
      </div>

      <Input
        className="h-8 text-xs"
        placeholder="Notas del documento"
        value={item.notes || ''}
        onChange={(event) => onNotesChange(item, event.target.value)}
        onBlur={() => onNotesSave?.(item)}
      />
    </div>
  );
}