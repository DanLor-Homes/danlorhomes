import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MessageDraftDialog from '@/components/clients/MessageDraftDialog';

export default function QuickRepliesCard({ leads }) {
  const [client, setClient] = useState(null);
  const [open, setOpen] = useState(false);

  const reply = (leadClient) => {
    setClient(leadClient);
    setOpen(true);
  };

  return (
    <div className="ed-bc">
      <p className="ed-sc" style={{ color: '#2D6A4F' }}>
        Respuesta inmediata
      </p>
      <h3 style={{ marginTop: 8 }}>Contesta antes de que se enfríe</h3>
      <p className="ed-sub" style={{ fontSize: 12, color: '#6b655a', marginTop: 6, lineHeight: 1.5 }}>
        La IA redacta el mensaje con el historial y el pipeline del lead.
      </p>

      {leads.length === 0 ? (
        <p className="ed-em">Ningún lead espera respuesta ahora mismo.</p>
      ) : (
        leads.slice(0, 3).map(({ client: lead, days }) => (
          <div key={lead.id} className="ed-au">
            <div className="ed-f1">
              <b>{lead.name}</b>
              <p>{days === null ? 'Sin interacciones registradas' : `Sin contacto desde hace ${days} días`}</p>
            </div>
            <button type="button" className="ed-btn2" onClick={() => reply(lead)}>
              Redactar
            </button>
          </div>
        ))
      )}

      <div className="ed-rp">
        <Link to="/leads" className="ed-lk">
          Ver todos los leads
        </Link>
      </div>

      <MessageDraftDialog client={client} open={open} onOpenChange={setOpen} />
    </div>
  );
}