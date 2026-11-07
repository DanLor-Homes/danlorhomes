import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

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
    <section className="ed-sec ed-d4">
      <div className="ed-sh">
        <h3>Automatizaciones</h3>
      </div>
      <p className="ed-sub" style={{ margin: '-6px 0 6px' }}>
        Activa o pausa cada flujo automático sin tocar nada técnico.
      </p>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e4ddd0] border-t-[#2D6A4F]" />
        </div>
      ) : (
        RULES.map((rule) => (
          <div key={rule.key} className="ed-au">
            <div className="ed-f1">
              <b>{rule.label}</b>
              <p>{rule.hint}</p>
            </div>
            <label className="ed-sw">
              <input
                type="checkbox"
                checked={enabled[rule.key] !== false}
                disabled={saving === rule.key}
                onChange={(event) => toggle(rule.key, event.target.checked)}
                aria-label={rule.label}
              />
              <span />
            </label>
          </div>
        ))
      )}
    </section>
  );
}