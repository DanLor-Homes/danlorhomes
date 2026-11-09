import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { base44 } from '@/api/base44Client';

const LABELS = {
  pipeline: 'Pipeline y tareas',
  seguimiento: 'Seguimiento de clientes',
  portales: 'Revisión de portales',
};

const KEYS = ['portales', 'pipeline', 'seguimiento'];

const formatRun = (value) => {
  if (!value) return 'Sin ejecutar';
  const run = moment(value);
  if (!run.isValid()) return 'Sin ejecutar';
  const today = moment().startOf('day');
  if (run.isSame(today, 'day')) return `hoy ${run.format('HH:mm')}`;
  if (run.isAfter(today.clone().subtract(1, 'day'))) return `ayer ${run.format('HH:mm')}`;
  return run.format('DD/MM/YYYY HH:mm');
};

export default function AutomationStatus() {
  const [runs, setRuns] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    base44.entities.AutomationRun.list({ sort: '-run_at', limit: 40 })
      .then((page) => {
        const latest = {};
        (page.items || []).forEach((row) => {
          if (!latest[row.key]) latest[row.key] = row;
        });
        if (active) {
          setRuns(latest);
          setLoading(false);
        }
      })
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const anyRun = KEYS.some((key) => runs[key]);

  return (
    <section className="ed-sec ed-d4">
      <div className="ed-sh">
        <h3>Última ejecución</h3>
      </div>
      <p className="ed-sub">
        {anyRun
          ? 'Trabajo automático ya realizado por el sistema.'
          : 'Todavía no se han ejecutado: portales a las 7:30 y el resto a las 8:00.'}
      </p>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e4ddd0] border-t-[#1f3f63] dark:border-[#33414f] dark:border-t-[#8fb3d6]" />
        </div>
      ) : (
        KEYS.map((key) => {
          const run = runs[key];
          return (
            <div key={key} className="ed-au">
              <div className="ed-f1">
                <b>{LABELS[key]}</b>
                <p>{run?.summary || (key === 'portales' ? 'Anuncios nuevos de captación' : 'Sin datos de la última pasada')}</p>
              </div>
              <span className={run ? 'ed-sc' : 'ed-note'}>{formatRun(run?.run_at)}</span>
            </div>
          );
        })
      )}
    </section>
  );
}