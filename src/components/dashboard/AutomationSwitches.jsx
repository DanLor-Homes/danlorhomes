import React, { useEffect, useState } from 'react';
import { Workflow } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Switch } from '@/components/ui/switch';

const RULES = [
  {
    key: 'retomar',
    label: 'Retomar contacto',
    hint: 'Crea tarea cuando una oportunidad lleva 7 días sin actividad.',
  },
  {
    key: 'desbloquear',
    label: 'Desbloquear etapas',
    hint: 'Avisa si una etapa se estanca 7 días o más.',
  },
  {
    key: 'cierre',
    label: 'Cierres inminentes',
    hint: 'Tarea cuando el cierre previsto está a menos de 3 días.',
  },
  {
    key: 'archivar',
    label: 'Archivar cerradas',
    hint: 'Archiva operaciones ganadas o perdidas tras 30 días.',
  },
];

export default function AutomationSwitches() {
  const [enabled, setEnabled] = useState({});
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      const page = await base44.entities.AutomationRule.list({ limit: 50 });
      const map = {};
      (page.items || []).forEach((row) => {
        map[row.key] = row;
      });

      const missing = RULES.filter((rule) => !map[rule.key]);
      if (missing.length) {
        const created = await Promise.all(
          missing.map((rule) => base44.entities.AutomationRule.create({ key: rule.key, active: true }))
        );
        created.forEach((row) => {
          map[row.key] = row;
        });
      }

      if (!active) return;
      const state = {};
      RULES.forEach((rule) => {
        state[rule.key] = map[rule.key] ? map[rule.key].active !== false : true;
      });
      setEnabled(state);
      setRecords(map);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const toggle = async (key, value) => {
    setEnabled((prev) => ({ ...prev, [key]: value }));
    setSaving(key);
    const record = records[key];
    if (record) {
      await base44.entities.AutomationRule.update(record.id, { active: value });
    } else {
      const created = await base44.entities.AutomationRule.create({ key, active: value });
      setRecords((prev) => ({ ...prev, [key]: created }));
    }
    setSaving('');
  };

  return (
    <section className="card-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-heading text-sm font-bold">
            <Workflow className="h-4 w-4 text-primary" />
            Automatizaciones
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Activa o pausa cada flujo automático sin tocar nada técnico.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      ) : (
        <ul className="space-y-3">
          {RULES.map((rule) => (
            <li key={rule.key} className="flex items-start justify-between gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-sm font-medium leading-snug">{rule.label}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{rule.hint}</p>
              </div>
              <Switch
                checked={enabled[rule.key] !== false}
                disabled={saving === rule.key}
                onCheckedChange={(value) => toggle(rule.key, value)}
                aria-label={rule.label}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}