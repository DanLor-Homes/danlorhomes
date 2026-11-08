import React, { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { aiErrorMessage } from '@/lib/aiError';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AiResultPanel from './AiResultPanel';

const PROPERTY_TYPES = ['piso', 'atico', 'adosado', 'chalet', 'local', 'oficina', 'garaje', 'nave', 'terreno'];

export default function OwnerCopyTool() {
  const [zone, setZone] = useState('');
  const [propertyType, setPropertyType] = useState('piso');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!zone.trim()) {
      setError('Indica la zona o dirección del inmueble.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await base44.functions.invoke('captureAi', { tool: 'owner', zone, propertyType, notes });
      setResult(response.data || {});
    } catch (err) {
      setResult(null);
      setError(aiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="owner-zone">Zona o dirección</Label>
          <Input
            id="owner-zone"
            value={zone}
            onChange={(event) => setZone(event.target.value)}
            placeholder="Ej. San Pedro Alcántara, Marbella"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Tipo de inmueble</Label>
          <Select value={propertyType} onValueChange={setPropertyType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="owner-notes">Datos del inmueble (opcional)</Label>
        <Textarea
          id="owner-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Metros, habitaciones, terraza, estado, si está alquilado…"
          className="min-h-[70px]"
        />
      </div>

      <Button onClick={run} disabled={loading}>
        {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
        Generar textos
      </Button>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {result && (
        <AiResultPanel
          title={result.headline}
          summary={result.ad?.title}
          sections={[
            { heading: 'Descripción del anuncio', items: result.ad?.description ? [result.ad.description] : [] },
            { heading: 'WhatsApp al propietario', items: result.whatsapp ? [result.whatsapp] : [] },
            {
              heading: 'Email al propietario',
              items: result.email ? [`Asunto: ${result.email.subject}\n\n${result.email.body}`] : [],
            },
            { heading: 'Argumentos a favor de la agencia', items: result.pitch || [] },
            {
              heading: 'Objeciones y respuestas',
              items: (result.objections || []).map((item) => `${item.topic}\n${item.answer}`),
            },
          ]}
        />
      )}
    </div>
  );
}