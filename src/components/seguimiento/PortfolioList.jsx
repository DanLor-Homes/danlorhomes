import React from 'react';
import { Building2 } from 'lucide-react';
import EmptyState from '@/components/crm/EmptyState';
import PortfolioRow from './PortfolioRow';

export default function PortfolioList({ properties, visitsByProperty, onFollowUp }) {
  if (!properties.length) {
    return (
      <EmptyState
        icon={Building2}
        title="Sin inmuebles en cartera"
        description="Cuando des de alta un inmueble aparecerá aquí con sus visitas y avisos de seguimiento."
      />
    );
  }

  return (
    <div className="space-y-2">
      {properties.map((property) => {
        const entry = visitsByProperty[property.id] || { count: 0, last: null };
        return (
          <PortfolioRow
            key={property.id}
            property={property}
            visits={entry.count}
            lastVisit={entry.last}
            onFollowUp={onFollowUp}
          />
        );
      })}
    </div>
  );
}