import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CONDITIONS, OPERATIONS, PROPERTY_TYPES, operationLabel } from '@/lib/properties';
import { formatCurrency } from '@/lib/crm';

export default function SubjectForm({ value, onChange, market }) {
  const set = (patch) => onChange(patch);

  return (
    <div className="mb-5 rounded-2xl border border-border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label htmlFor="v-address">Calle</Label>
          <Input
            id="v-address"
            value={value.address}
            onChange={(e) => set({ address: e.target.value })}
            placeholder="Calle Real, 24, 3º B"
          />
        </div>
        <div>
          <Label htmlFor="v-town">Municipio</Label>
          <Input
            id="v-town"
            value={value.municipality}
            onChange={(e) => set({ municipality: e.target.value })}
            placeholder="Estepona"
          />
        </div>
        <div>
          <Label htmlFor="v-province">Provincia</Label>
          <Input
            id="v-province"
            value={value.province}
            onChange={(e) => set({ province: e.target.value })}
            placeholder="Málaga"
          />
        </div>
        <div>
          <Label htmlFor="v-surface">Superficie (m²)</Label>
          <Input
            id="v-surface"
            type="number"
            min="0"
            value={value.surface}
            onChange={(e) => set({ surface: e.target.value })}
            placeholder="95"
          />
        </div>
        <div>
          <Label>Tipo</Label>
          <Select value={value.property_type} onValueChange={(next) => set({ property_type: next })}>
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
          <Select value={value.operation} onValueChange={(next) => set({ operation: next })}>
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
        <div>
          <Label>Estado de conservación</Label>
          <Select value={value.condition || 'buen_estado'} onValueChange={(next) => set({ condition: next })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONDITIONS.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="v-year">Año de construcción</Label>
          <Input
            id="v-year"
            type="number"
            min="1800"
            value={value.year_built}
            onChange={(e) => set({ year_built: e.target.value })}
            placeholder="1998"
          />
        </div>
        <div>
          <Label htmlFor="v-reference">€/m² de referencia de la zona</Label>
          <Input
            id="v-reference"
            type="number"
            min="0"
            value={value.reference_m2}
            onChange={(e) => set({ reference_m2: e.target.value })}
            placeholder="3.300"
          />
        </div>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        {market?.priceM2
          ? `Referencia de ${market.label || 'la zona'}: ${formatCurrency(market.priceM2)}/m² (${market.source}). Puedes ajustarla si conoces el mercado.`
          : 'Sin referencia para esta ubicación: indica el €/m² de la zona o añade testigos de mercado.'}
      </p>
    </div>
  );
}