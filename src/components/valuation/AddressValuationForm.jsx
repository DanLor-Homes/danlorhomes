import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OPERATIONS, PROPERTY_TYPES, operationLabel } from '@/lib/properties';

export default function AddressValuationForm({ draft, onChange }) {
  const set = (key, value) => onChange({ ...draft, [key]: value });

  return (
    <div className="mb-5 rounded-2xl border border-border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label htmlFor="v-address">Calle</Label>
          <Input
            id="v-address"
            value={draft.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="Calle Real, 24, 3º B"
          />
        </div>
        <div>
          <Label htmlFor="v-town">Municipio</Label>
          <Input
            id="v-town"
            value={draft.municipality}
            onChange={(e) => set('municipality', e.target.value)}
            placeholder="Estepona"
          />
        </div>
        <div>
          <Label htmlFor="v-province">Provincia</Label>
          <Input
            id="v-province"
            value={draft.province}
            onChange={(e) => set('province', e.target.value)}
            placeholder="Málaga"
          />
        </div>
        <div>
          <Label htmlFor="v-surface">Superficie (m²)</Label>
          <Input
            id="v-surface"
            type="number"
            min="0"
            value={draft.surface}
            onChange={(e) => set('surface', e.target.value)}
            placeholder="95"
          />
        </div>
        <div>
          <Label>Tipo</Label>
          <Select value={draft.property_type} onValueChange={(value) => set('property_type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Operación</Label>
          <Select value={draft.operation} onValueChange={(value) => set('operation', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATIONS.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {operationLabel(option.id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Compara primero con los inmuebles del municipio y, si no hay suficientes, con toda la provincia. Al guardar, el
        inmueble se crea en captación con su tasación.
      </p>
    </div>
  );
}