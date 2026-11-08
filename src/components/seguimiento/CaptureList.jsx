import React from 'react';
import { UserRound } from 'lucide-react';
import EmptyState from '@/components/crm/EmptyState';
import CaptureRow from './CaptureRow';

export default function CaptureList({ listings, onContact, onAnalyze, onConvert, onDiscard }) {
  if (!listings.length) {
    return (
      <EmptyState
        icon={UserRound}
        title="Sin anuncios pendientes"
        description="Todos los inmuebles captados en portales están contactados o convertidos en cliente."
      />
    );
  }

  return (
    <div className="space-y-2">
      {listings.map((listing) => (
        <CaptureRow
          key={listing.id}
          listing={listing}
          onContact={onContact}
          onAnalyze={onAnalyze}
          onConvert={onConvert}
          onDiscard={onDiscard}
        />
      ))}
    </div>
  );
}