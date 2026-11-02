import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { CHANNELS, LOSS_REASONS, PRODUCTS, STAGES, probabilityForStage, statusForStage } from '@/lib/crm';
import { useToast } from '@/components/ui/use-toast';

const EMPTY = {
  name: '',
  client_id: '',
  amount: '',
  stage: 'nuevo_lead',
  probability: 10,
  product: 'servicios_inmobiliarios',
  channel_id: '',
  loss_reason: '',
  expected_closing_date: '',
};

export default function OpportunityDialog({ open, onOpenChange, opportunity, clients = [], channels = [], defaultStage, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setError('');
    if (opportunity) {
      setForm({
        ...EMPTY,
        ...opportunity,
        amount: opportunity.amount ?? '',
        loss_reason: opportunity.loss_reason || '',
        expected_closing_date: opportunity.expected_closing_date || '',
      });
    } else {
      const stage = defaultStage || 'nuevo_lead';
      setForm({ ...EMPTY, stage, probability: probabilityForStage(stage) });
    }
  }, [open, opportunity, defaultStage]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleStage = (stage) => {
    setForm((prev) => ({
      ...prev,
      stage,
      probability: probabilityForStage(stage),
      loss_reason: stage === 'perdido' ? prev.loss_reason || 'precio' : '',
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('El nombre de la oportunidad es obligatorio.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      name: form.name.trim(),
      client_id: form.client_id || '',
      amount: Number(form.amount) || 0,
      stage: form.stage,
      probability: Number(form.probability) || 0,
      product: form.product,
      channel_id: form.channel_id || '',
      loss_reason: form.stage === 'perdido' ? form.loss_reason || 'otro' : '',
      expected_closing_date: form.expected_closing_date || '',
      status: statusForStage(form.stage),
    };
    if (!opportunity || opportunity.stage !== form.stage) {
      payload.stage_changed_date = new Date().toISOString();
    }
    try {
      if (opportunity?.id) {
        await base44.entities.Opportunity.update(opportunity.id, payload);
        if (payload.status === 'won' && opportunity.status !== 'won') {
          base44.analytics.track({ eventName: 'opportunity_won' });
        }
      } else {
        await base44.entities.Opportunity.create({ ...payload, archived: false });
        base44.analytics.track({ eventName: 'opportunity_created' });
      }
      toast({ title: opportunity?.id ? 'Oportunidad actualizada' : 'Oportunidad creada' });
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      setError(err?.message || 'No se pudo guardar la oportunidad.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{opportunity?.id ? 'Editar oportunidad' : 'Nueva oportunidad'}</DialogTitle>
          <DialogDescription>La probabilidad se ajusta automáticamente según la etapa.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="o-name">Nombre *</Label>
            <Input id="o-name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Captación edificio Marbella" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Cliente</Label>
              <Select value={form.client_id} onValueChange={(v) => set('client_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="o-amount">Valor estimado (€)</Label>
              <Input id="o-amount" type="number" min="0" step="100" value={form.amount} onChange={(e) => set('amount', e.target.value)} />
            </div>
            <div>
              <Label>Etapa</Label>
              <Select value={form.stage} onValueChange={handleStage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.label} · {stage.probability}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="o-prob">Probabilidad (%)</Label>
              <Input id="o-prob" type="number" min="0" max="100" value={form.probability} onChange={(e) => set('probability', e.target.value)} />
            </div>
            <div>
              <Label>Producto</Label>
              <Select value={form.product} onValueChange={(v) => set('product', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCTS.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Canal</Label>
              <Select value={form.channel_id} onValueChange={(v) => set('channel_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona canal" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="o-close">Fecha cierre estimada</Label>
              <Input id="o-close" type="date" value={form.expected_closing_date} onChange={(e) => set('expected_closing_date', e.target.value)} />
            </div>
            {form.stage === 'perdido' && (
              <div>
                <Label>Motivo de pérdida</Label>
                <Select value={form.loss_reason} onValueChange={(v) => set('loss_reason', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOSS_REASONS.map((reason) => (
                      <SelectItem key={reason.id} value={reason.id}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {opportunity?.id ? 'Guardar cambios' : 'Crear oportunidad'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}