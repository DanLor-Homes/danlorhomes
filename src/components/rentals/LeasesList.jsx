import React from 'react';
import { KeyRound } from 'lucide-react';
import EmptyState from '@/components/crm/EmptyState';
import LeaseRow from '@/components/rentals/LeaseRow';

export default function LeasesList({ leases, onEdit }) {
  if (!leases.length) {
    return (
      <EmptyState
        icon={KeyRound}
        title="Todavía no hay contratos de alquiler"
        description="Da de alta el contrato con el inquilino, la renta y el día de cobro para empezar a generar recibos."
      />
    );
  }

  return (
    <div className="space-y-2">
      {leases.map((lease) => (
        <LeaseRow key={lease.id} lease={lease} onEdit={onEdit} />
      ))}
    </div>
  );
}