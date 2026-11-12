import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OPERATIONS, PROPERTY_TYPES } from '@/lib/properties';
import { MLS_STATUSES, emptyMlsFilters } from '@/lib/mls';

const ALL = 'all';

export default function MlsFilters({ filters, onChange, zones = [] }) {
  const setSelect = (key, value) => onChange({ ...filters, [key]: value === ALL ? '' : value });

  return (
    <div className="card-surface mb-5 flex flex-col gap-2.5 p-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative min-w-0 flex-1 sm:min-w-[230px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.q}
          onChange={(event) => onChange({ ...filters, q: event.target.value })}
          placeholder="Buscar por título, zona o agencia"
          className="h-9 pl-9"
        />
      </div>

      <Select value={filters.operation || ALL} onValueChange={(value) => setSelect('operation', value)}>
        <SelectTrigger className="h-9 w-full sm:w-[140px]">
          <SelectValue placeholder="Operación" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Toda operación</SelectItem>
          {OPERATIONS.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.property_type || ALL}
        onValueChange={(value) => setSelect('property_type', value)}
      >
        <SelectTrigger className="h-9 w-full sm:w-[145px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todo tipo</SelectItem>
          {PROPERTY_TYPES.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.zone || ALL} onValueChange={(value) => setSelect('zone', value)}>
        <SelectTrigger className="h-9 w-full sm:w-[150px]">
          <SelectValue placeholder="Zona" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Toda zona</SelectItem>
          {zones.map((zone) => (
            <SelectItem key={zone} value={zone}>
              {zone}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.status || ALL} onValueChange={(value) => setSelect('status', value)}>
        <SelectTrigger className="h-9 w-full sm:w-[145px]">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todo estado</SelectItem>
          {MLS_STATUSES.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="number"
        inputMode="numeric"
        value={filters.max_price}
        onChange={(event) => onChange({ ...filters, max_price: event.target.value })}
        placeholder="Precio máx."
        className="h-9 w-full sm:w-[130px]"
      />

      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => onChange(emptyMlsFilters())}>
        <X className="h-3.5 w-3.5" /> Limpiar
      </Button>
    </div>
  );
}