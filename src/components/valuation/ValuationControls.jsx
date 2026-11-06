import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ValuationControls({ properties, subjectId, onSubject, zones, referenceZone, onReferenceZone }) {
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="valuation-subject">Inmueble a tasar</Label>
        <Select value={subjectId} onValueChange={onSubject}>
          <SelectTrigger id="valuation-subject">
            <SelectValue placeholder="Selecciona un inmueble" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="valuation-zone">Zona de referencia</Label>
        <Select value={referenceZone || 'ninguna'} onValueChange={(value) => onReferenceZone(value === 'ninguna' ? '' : value)}>
          <SelectTrigger id="valuation-zone">
            <SelectValue placeholder="Zona de referencia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ninguna">Sin zona de referencia</SelectItem>
            {zones.map((zone) => (
              <SelectItem key={zone} value={zone}>
                {zone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}