import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CreditCard, Download, FileText, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/crm/EmptyState';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import InvoiceDocument from './InvoiceDocument';
import InvoiceFormDialog from './InvoiceFormDialog';
import { formatDate, formatMoney, nextInvoiceNumber, statusMeta, today } from '@/lib/invoices';
import { downloadElementAsPdf } from '@/lib/pdf';

const Stat = ({ label, value, hint }) => (
  <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
    <p className="mt-1 font-heading text-lg font-extrabold tabular-nums">{value}</p>
    {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
  </div>
);

export default function InvoicesPanel({ properties = [], clients = [] }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const documentRef = useRef(null);
  const { toast } = useToast();

  const loadInvoices = useCallback(async () => {
    const res = await base44.entities.Invoice.filter({}, { sort: '-issue_date', limit: 200 });
    setInvoices(res.items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const selected = invoices.find((invoice) => invoice.id === selectedId) || null;

  const defaultIssuer = useMemo(() => invoices.find((invoice) => invoice.issuer?.nif)?.issuer || undefined, [invoices]);
  const suggestedNumber = useMemo(() => nextInvoiceNumber(invoices), [invoices]);

  const stats = useMemo(() => {
    const issued = invoices.filter((invoice) => invoice.status !== 'borrador');
    const billed = issued.reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0);
    const paid = invoices
      .filter((invoice) => invoice.status === 'pagada')
      .reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0);
    return { count: invoices.length, billed, paid, pending: billed - paid };
  }, [invoices]);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (invoice) => {
    setEditing(invoice);
    setDialogOpen(true);
  };

  const handleSaved = async (saved) => {
    await loadInvoices();
    const id = saved?.id || saved?.data?.id;
    if (id) setSelectedId(id);
    toast({ title: 'Factura guardada', description: 'La factura ya está disponible para descargar en PDF.' });
  };

  const markPaid = async (invoice) => {
    await base44.entities.Invoice.update(invoice.id, { status: 'pagada', paid_date: today() });
    await loadInvoices();
    toast({ title: 'Factura cobrada', description: `${invoice.number} se ha marcado como cobrada.` });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await base44.entities.Invoice.delete(deleteTarget.id);
    setDeleteTarget(null);
    if (selectedId === deleteTarget.id) setSelectedId(null);
    await loadInvoices();
    toast({ title: 'Factura eliminada' });
  };

  const handleDownload = async () => {
    if (!documentRef.current || !selected) return;
    setDownloading(true);
    try {
      await downloadElementAsPdf(documentRef.current, `Factura-${selected.number || 'borrador'}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Facturas" value={stats.count} hint="Documentos registrados" />
        <Stat label="Facturado" value={formatMoney(stats.billed)} hint="Emitidas y cobradas" />
        <Stat label="Pendiente de cobro" value={formatMoney(stats.pending)} hint={`Cobrado ${formatMoney(stats.paid)}`} />
      </div>

      {selected ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/70 bg-card p-3">
            <Button variant="ghost" onClick={() => setSelectedId(null)}>
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Todas las facturas
            </Button>
            <div className="flex flex-wrap gap-2">
              {selected.status !== 'pagada' && (
                <Button variant="outline" onClick={() => markPaid(selected)}>
                  <CreditCard className="mr-1.5 h-4 w-4" /> Marcar cobrada
                </Button>
              )}
              <Button variant="outline" onClick={() => openEdit(selected)}>
                <Pencil className="mr-1.5 h-4 w-4" /> Editar
              </Button>
              <Button variant="outline" onClick={() => setDeleteTarget(selected)}>
                <Trash2 className="mr-1.5 h-4 w-4" /> Eliminar
              </Button>
              <Button onClick={handleDownload} disabled={downloading}>
                {downloading ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-1.5 h-4 w-4" />
                )}
                Descargar PDF
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border/70 bg-muted/20 p-2">
            <div ref={documentRef} className="bg-white">
              <InvoiceDocument invoice={selected} />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Historial de facturas con su estado, fechas de emisión, vencimiento y cobro.
            </p>
            <Button onClick={openNew}>
              <Plus className="mr-1.5 h-4 w-4" /> Nueva factura
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : invoices.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Todavía no hay facturas"
              description="Emite tu primera factura con IVA y descárgala en PDF."
              action={<Button onClick={openNew}>Crear factura</Button>}
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {invoices.map((invoice) => {
                const meta = statusMeta(invoice.status);
                return (
                  <button
                    key={invoice.id}
                    type="button"
                    onClick={() => setSelectedId(invoice.id)}
                    className="flex flex-col rounded-2xl border border-border/70 bg-card p-4 text-left transition hover:border-primary/40 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-heading text-sm font-bold tabular-nums">{invoice.number}</p>
                        <p className="truncate text-xs text-muted-foreground">{invoice.client_name}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${meta.badge}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-3 font-heading text-lg font-extrabold tabular-nums">
                      {formatMoney(invoice.total)}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatDate(invoice.issue_date)} · vence {formatDate(invoice.due_date)}
                      {invoice.status === 'pagada' ? ` · cobrada ${formatDate(invoice.paid_date)}` : ''}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <InvoiceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        invoice={editing}
        clients={clients}
        properties={properties}
        nextNumber={suggestedNumber}
        defaultIssuer={defaultIssuer}
        onSaved={handleSaved}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar la factura {deleteTarget?.number}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrará el registro y no podrás volver a descargarla en PDF. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}