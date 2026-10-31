import React, { useEffect, useState } from 'react';
import { Loader2, MapPinned, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';

export default function AssignmentRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zone, setZone] = useState('');
  const [assignee, setAssignee] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let active = true;
    base44.entities.AssignmentRule.list({ sort: 'zone', limit: 100 }).then((res) => {
      if (!active) return;
      setRules(res.items || []);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const addRule = async (event) => {
    event.preventDefault();
    if (!zone.trim() || !assignee.trim()) return;
    setSaving(true);
    const created = await base44.entities.AssignmentRule.create({
      zone: zone.trim(),
      assignee: assignee.trim(),
      priority: 0,
      active: true,
    });
    setRules((prev) => [...prev, created].sort((a, b) => (a.zone || '').localeCompare(b.zone || '', 'es')));
    setZone('');
    setAssignee('');
    setSaving(false);
    toast({ title: 'Regla creada', description: `${created.zone} → ${created.assignee}` });
  };

  const toggleRule = async (rule, active) => {
    setRules((prev) => prev.map((item) => (item.id === rule.id ? { ...item, active } : item)));
    await base44.entities.AssignmentRule.update(rule.id, { active });
  };

  const removeRule = async (rule) => {
    setRules((prev) => prev.filter((item) => item.id !== rule.id));
    await base44.entities.AssignmentRule.delete(rule.id);
    toast({ title: 'Regla eliminada', description: rule.zone });
  };

  return (
    <section className="card-surface overflow-hidden lg:col-span-2">
      <div className="border-b border-border/70 px-5 py-3">
        <h3 className="font-heading text-sm font-bold">Reparto por zona</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Cuando un cliente encaja con una zona, su responsable se asigna solo. Gana la zona más específica.
        </p>
      </div>

      <form onSubmit={addRule} className="grid gap-3 border-b border-border/70 px-5 py-3 sm:grid-cols-[1.4fr_1.2fr_auto] sm:items-end">
        <div>
          <Label htmlFor="rule-zone">Zona</Label>
          <Input
            id="rule-zone"
            value={zone}
            onChange={(event) => setZone(event.target.value)}
            placeholder="Estepona"
          />
        </div>
        <div>
          <Label htmlFor="rule-assignee">Responsable</Label>
          <Input
            id="rule-assignee"
            value={assignee}
            onChange={(event) => setAssignee(event.target.value)}
            placeholder="Ana López"
          />
        </div>
        <Button type="submit" size="sm" disabled={saving || !zone.trim() || !assignee.trim()}>
          {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
          Añadir regla
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : rules.length === 0 ? (
        <div className="flex items-center gap-2.5 px-5 py-6 text-xs text-muted-foreground">
          <MapPinned className="h-4 w-4" />
          Sin reglas: define la primera arriba para repartir leads por zona.
        </div>
      ) : (
        rules.map((rule) => (
          <div
            key={rule.id}
            className="flex items-center justify-between gap-3 border-b border-border/50 px-5 py-2.5 text-sm last:border-0"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{rule.zone}</p>
              <p className="truncate text-[11px] text-muted-foreground">{rule.assignee}</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={rule.active !== false} onCheckedChange={(next) => toggleRule(rule, next)} />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => removeRule(rule)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))
      )}
    </section>
  );
}