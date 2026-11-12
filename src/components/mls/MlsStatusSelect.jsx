import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MLS_STATUSES } from '@/lib/mls';

export default function MlsStatusSelect({ listing, onChange }) {
  return (
    <Select
      value={listing.status || 'disponible'}
      onValueChange={(value) => onChange(listing, value)}
    >
      <SelectTrigger className="h-8 w-[130px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MLS_STATUSES.map((status) => (
          <SelectItem key={status.id} value={status.id}>
            {status.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}