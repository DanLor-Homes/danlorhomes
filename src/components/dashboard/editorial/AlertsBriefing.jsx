import React from 'react';
import { Image } from '@/components/ui/image';
import { formatDate } from '@/lib/crm';
import MandateAlertRow from '@/components/owners/MandateAlertRow';
import { ROW_IMAGE } from './assets';

export default function AlertsBriefing({ alerts, limit }) {
  const total =
    alerts.staleQuotes.length +
    alerts.risky.length +
    alerts.overdue.length +
    alerts.mandatesExpired.length +
    alerts.mandatesThisWeek.length;

  return (
    <section className="ed-sec ed-d3">
      <div className="ed-sh">
        <h3>Avisos automáticos</h3>
      </div>

      {total === 0 ? (
        <p className="ed-ok">
          Todo al día: sin mandatos caducados ni por vencer, presupuestos sin respuesta, cierres inminentes ni tareas
          vencidas.
        </p>
      ) : (
        <div>
          {alerts.mandatesExpired.slice(0, limit).map((property) => (
            <MandateAlertRow key={`expired-${property.id}`} property={property} />
          ))}
          {alerts.mandatesExpired.length > limit && (
            <p className="ed-note">y {alerts.mandatesExpired.length - limit} mandatos caducados más</p>
          )}
          {alerts.mandatesThisWeek.slice(0, limit).map((property) => (
            <MandateAlertRow key={`week-${property.id}`} property={property} />
          ))}
          {alerts.mandatesThisWeek.length > limit && (
            <p className="ed-note">y {alerts.mandatesThisWeek.length - limit} mandatos más que vencen esta semana</p>
          )}

          {alerts.staleQuotes.map((op) => (
            <div key={`quote-${op.id}`} className="ed-al">
              <span className="ed-tag">Presupuesto</span>
              <div className="ed-f1">
                <p className="ed-n">{op.name}</p>
                <p className="ed-s">Presupuesto enviado sin respuesta hace {op.days} días</p>
              </div>
              <Image src={ROW_IMAGE} alt="" className="ed-ph" fittingType="fill" />
            </div>
          ))}

          {alerts.risky.map((op) => (
            <div key={`risk-${op.id}`} className="ed-al">
              <span className="ed-tag">Cierre</span>
              <div className="ed-f1">
                <p className="ed-n">{op.name}</p>
                <p className="ed-s">
                  Cierre previsto {formatDate(op.expected_closing_date)} · quedan {op.remaining} días
                </p>
              </div>
              <Image src={ROW_IMAGE} alt="" className="ed-ph" fittingType="fill" />
            </div>
          ))}

          {alerts.overdue.map((task) => (
            <div key={`task-${task.id}`} className="ed-al">
              <span className="ed-tag">Tarea</span>
              <div className="ed-f1">
                <p className="ed-n">{task.title}</p>
                <p className="ed-s">Vencida el {formatDate(task.due_date)}</p>
              </div>
              <Image src={ROW_IMAGE} alt="" className="ed-ph" fittingType="fill" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}