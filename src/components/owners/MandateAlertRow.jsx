import React from 'react';
import { Link } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import { formatDate } from '@/lib/crm';
import { mandateLabel } from '@/lib/mandates';
import { ROW_IMAGE } from '@/components/dashboard/editorial/assets';

export default function MandateAlertRow({ property }) {
  const expired = property.days < 0;
  const days = Math.abs(property.days);

  return (
    <Link to="/propietarios" className="ed-al">
      <span className="ed-tag">{expired ? 'Caducado' : 'Mandato'}</span>
      <div className="ed-f1">
        <p className="ed-n">{property.title}</p>
        <p className="ed-s">
          {mandateLabel(property.mandato)} {expired ? 'caducado el' : 'caduca el'} {formatDate(property.mandate_end)}
          {expired
            ? ` · hace ${days} ${days === 1 ? 'día' : 'días'}`
            : property.days === 0
              ? ' · hoy'
              : ` · en ${property.days} ${property.days === 1 ? 'día' : 'días'}`}
          {property.owner_name ? ` · ${property.owner_name}` : ''}
        </p>
      </div>
      <Image src={ROW_IMAGE} alt="" className="ed-ph" fittingType="fill" />
    </Link>
  );
}