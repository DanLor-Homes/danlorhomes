import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function QuickReplies({ onUse }) {
  const [replies, setReplies] = useState([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.QuickReply.list('-created_date', 100).then((page) => setReplies(page.items || []));
  }, []);

  const add = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const created = await base44.entities.QuickReply.create({
        title: title.trim() || 'Respuesta rápida',
        body: text.trim(),
      });
      setReplies((list) => [created, ...list]);
      setTitle('');
      setText('');
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    await base44.entities.QuickReply.delete(id);
    setReplies((list) => list.filter((item) => item.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs text-muted-foreground">Respuestas rápidas</Label>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
        >
          <Plus className="h-3 w-3" /> Añadir
        </button>
      </div>

      {replies.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {replies.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/50 pl-2.5 pr-1 py-0.5"
            >
              <button
                type="button"
                onClick={() => onUse(item.body)}
                title={item.body}
                className="max-w-[190px] truncate py-0.5 text-[11px] font-medium hover:text-primary"
              >
                {item.title}
              </button>
              <button
                type="button"
                onClick={() => remove(item.id)}
                aria-label={`Eliminar ${item.title}`}
                className="rounded-full p-0.5 text-muted-foreground transition-colors hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="mt-2 space-y-2 rounded-xl border border-border/70 bg-muted/30 p-2.5">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Nombre (ej. Recordar visita)"
            className="h-8 text-xs"
            maxLength={60}
          />
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Hola {{nombre}}, te recuerdo la visita de mañana…"
            rows={2}
            className="text-xs"
          />
          <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={add} disabled={saving}>
              Guardar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}