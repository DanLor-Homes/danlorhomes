import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/crm';

export default function StageList({ stages, maxStageValue }) {
  return (
    <section className="ed-sec ed-d2">
      <div className="ed-sh">
        <div>
          <h3>Oportunidades por etapa</h3>
          <p className="ed-sub">Valor estimado acumulado en cada fase</p>
        </div>
        <Link to="/informes" className="ed-lk">
          Informes
        </Link>
      </div>
      {stages.map((stage) => (
        <div key={stage.id} className="ed-fr">
          <div className="ed-t">
            <b>{stage.label}</b>
            <span>
              {stage.count} · {formatCurrency(stage.value)}
            </span>
          </div>
          <div className="ed-bar">
            <i style={{ width: `${Math.max(stage.value ? 4 : 0, (stage.value / maxStageValue) * 100)}%` }} />
          </div>
        </div>
      ))}
    </section>
  );
}