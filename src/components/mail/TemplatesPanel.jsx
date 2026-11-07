import React, { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/crm/EmptyState';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import TemplateDialog from '@/components/mail/TemplateDialog';
import { TEMPLATE_CATEGORIES } from '@/lib/mail';

export default function TemplatesPanel({ templates, loading, onChanged }) {
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };

  const remove = async (template) => {
    await base44.entities.EmailTemplate.delete(template.id);
    toast({ title: 'Plantilla eliminada', description: template.name });
    onChanged?.();
  };

  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-muted" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" /> Nueva plantilla
        </Button>
      </div>

      {!templates.length ? (
        <EmptyState
          icon={Pencil}
          title="Sin plantillas"
          description="Crea mensajes reutilizables para seguimiento, visitas u ofertas."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {templates.map((template) => (
            <li key={template.id} className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-heading text-sm font-bold">{template.name}</p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-wide text-primary">
                    {TEMPLATE_CATEGORIES[template.category] || 'Otro'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditing(template);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(template)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{template.subject}</p>
              <pre className="mt-2 max-h-24 overflow-hidden whitespace-pre-wrap font-body text-[11px] leading-relaxed text-muted-foreground">
                {template.body}
              </pre>
            </li>
          ))}
        </ul>
      )}

      <TemplateDialog
        open={open}
        onOpenChange={setOpen}
        template={editing}
        onSaved={() => {
          setOpen(false);
          onChanged?.();
        }}
      />
    </div>
  );
}