import React from 'react';
import { CheckCheck } from 'lucide-react';

export default function AlertsBriefing({ alerts, onDismiss }) {
  return (
    <section className="ed-sec ed-d3 ed-alerts">
      <div className="ed-sh">
        <div>
          <h3>Avisos automáticos</h3>
          <p className="ed-sub">
            Cierres inminentes, leads calientes, etapas estancadas, presupuestos sin respuesta, inmuebles nuevos y
            mandatos.
          </p>
        </div>
        <span className="ed-count">{alerts.length}</span>
      </div>

      {alerts.length === 0 ? (
        <p className="ed-ok">
          Todo al día: sin cierres inminentes, leads calientes sin contacto, etapas estancadas, presupuestos sin
          respuesta, inmuebles nuevos en portales, mandatos por vencer ni tareas vencidas.
        </p>
      ) : (
        <>
          <p className="ed-note">Toca un aviso para revisarlo: se marca como visto y desaparece de la lista.</p>
          <div className="ed-alerts-grid">
            {alerts.map((alert) => (
              <button
                key={alert.key}
                type="button"
                className="ed-al"
                onClick={() => onDismiss(alert)}
                title="Marcar como revisado"
              >
                <span className="ed-tag">{alert.tag}</span>
                <span className="ed-f1">
                  <span className="ed-n ed-al-title">{alert.title}</span>
                  <span className="ed-s">{alert.detail}</span>
                </span>
                <CheckCheck className="ed-al-check" aria-hidden="true" />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}