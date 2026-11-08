import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ListingFilters({
  zones,
  zone,
  onZone,
  minPrice,
  onMinPrice,
  maxPrice,
  onMaxPrice,
  onClear,
  total,
}) {
  const active = zone !== 'todas' || Boolean(minPrice) || Boolean(maxPrice);

  return (
    <div className="card-surface p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-end">
        <div>
          <label htmlFor="listing-zone" className="mb-1 block text-[11px] font-semibold text-muted-foreground">
            Zona
          </label>
          <Select value={zone} onValueChange={onZone}>
            <SelectTrigger id="listing-zone">
              <SelectValue placeholder="Todas las zonas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las zonas</SelectItem>
              {zones.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="listing-min" className="mb-1 block text-[11px] font-semibold text-muted-foreground">
            Precio desde (€)
          </label>
          <Input
            id="listing-min"
            type="number"
            min="0"
            step="5000"
            inputMode="numeric"
            placeholder="Sin mínimo"
            value={minPrice}
            onChange={(event) => onMinPrice(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="listing-max" className="mb-1 block text-[11px] font-semibold text-muted-foreground">
            Precio hasta (€)
          </label>
          <Input
            id="listing-max"
            type="number"
            min="0"
            step="5000"
            inputMode="numeric"
            placeholder="Sin máximo"
            value={maxPrice}
            onChange={(event) => onMaxPrice(event.target.value)}
          />
        </div>

        <Button variant="ghost" onClick={onClear} disabled={!active}>
          <X className="mr-1.5 h-3.5 w-3.5" /> Limpiar
        </Button>
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        {total} {total === 1 ? 'inmueble disponible' : 'inmuebles disponibles'}
      </p>
    </div>
  );
}