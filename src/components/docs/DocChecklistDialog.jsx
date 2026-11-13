import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import DocItemRow from '@/components/docs/DocItemRow';
import { checklistProgress, templateFor } from '@/lib/documents';

export default function DocChecklistDialog({ open, property, documents, onOpenChange, onChanged }) {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);

  useEffect(() => {
    if (!open || !property) return;
    const existing = documents.filter((doc) => doc.property_id === property.id);
    if (existing.length) {
      setItems(existing);
      return;
    }
    let cancelled = false;
    const create = async () => {
      setLoading(true);
      const payload = templateFor(property.operation).map((entry) => ({
        ...entry,
        property_id: property.id,
        property_title: property.title || '',
        operation: property.operation || 'venta',
        status: 'pendiente',
      }));
      await base44.entities.PropertyDocument.bulkCreate(payload);
      const page = await base44.entities.PropertyDocument.filter(
        { property_id: property.id },
        { sort: 'created_date', limit: 100 }
      );
      if (!cancelled) {
        setItems(page.items || []);
        setLoading(false);
        onChanged?.();
      }
    };
    create();
    return () => {
      cancelled = true;
    };
  }, [open, property, documents]);

  const patchItem = (id, patch) => setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const save = async (id, patch) => {
    patchItem(id, patch);
    await base44.entities.PropertyDocument.update(id, patch);
    onChanged?.();
  };

  const handleUpload = async (item, file) => {
    setUploadingId(item.id);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      await save(item.id, {
        file_uri,
        file_name: file.name,
        status: item.status === 'pendiente' ? 'recibido' : item.status,
      });
      toast({ title: 'Documento adjuntado' });
    } finally {
      setUploadingId(null);
    }
  };

  const progress = checklistProgress(items);

  if (!property) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Checklist documental</DialogTitle>
        </DialogHeader>

        <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
          <p className="font-heading text-sm font-semibold">{property.title}</p>
          <p className="text-xs text-muted-foreground">
            {property.operation === 'alquiler' ? 'Alquiler' : 'Venta'} · {property.zone || 'Sin zona'} ·{' '}
            {progress.validated} de {progress.total} validados
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>

        {loading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Preparando el expediente…</p>
        ) : (
          <div>
            {items.map((item) => (
              <DocItemRow
                key={item.id}
                item={item}
                uploading={uploadingId === item.id}
                onStatusChange={(current, status) => save(current.id, { status })}
                onNotesChange={(current, notes) => patchItem(current.id, { notes })}
                onNotesSave={(current) => save(current.id, { notes: current.notes || '' })}
                onUpload={handleUpload}
              />
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}