import React from 'react';
import { Link } from 'react-router-dom';

export default function HotStaleLeads({ leads }) {
  return (
    <div className="ed-bc">
      <div className="ed-sh">
        <div>
          <h3>Leads calientes sin contacto</h3>
          <p className="ed-sub">Score 70 o más y sin interacción en los últimos 30 días</p>
        </div>
        <Link to="/leads" className="ed-lk">
          Ver leads
        </Link>
      </div>

      {leads.length === 0 ? (
        <p className="ed-em">Ningún lead caliente se ha enfriado: todos tienen contacto reciente.</p>
      ) : (
        leads.map(({ client, score, days }) => (
          <Link key={client.id} to="/leads" className="ed-al">
            <div className="ed-f1">
              <p className="ed-n">{client.name}</p>
              <p className="ed-s">
                {days === null ? 'Sin ninguna interacción registrada' : `Último contacto hace ${days} días`}
                {client.assigned_to ? ` · ${client.assigned_to}` : ''}
              </p>
            </div>
            <span className="ed-count">Score {score}</span>
          </Link>
        ))
      )}
    </div>
  );
}