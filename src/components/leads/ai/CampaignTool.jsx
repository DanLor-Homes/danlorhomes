import React, { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { aiErrorMessage } from '@/lib/aiError';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AiResultPanel from './AiResultPanel';

const SEGMENTS = [
  { id: 'propietarios', label: 'Propietarios que quieren vender' },
  { id: 'compradores', label: 'Compradores con presupuesto' },
  { id: 'inversores', label: 'Inversores y rentabilidad' },
  { id: 'alquiler', label: 'Propietarios de alquiler' },
];

export default function CampaignTool() {
  const [zone, setZone] = useState('');
  const [segment, setSegment] = useState('propietarios');
  const [goal, setGoal] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!zone.trim()) {
      setError('Indica la zona o municipio de la campaña.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await base44.functions.invoke('captureAi', { tool: 'campaign', zone, segment, goal });
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
          <Label htmlFor="campaign-zone">Zona o municipio</Label>
          <Input
            id="campaign-zone"
            value={zone}
            onChange={(event) => setZone(event.target.value)}
            placeholder="Marbella, Estepona, Mijas…"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Público objetivo</Label>
          <Select value={segment} onValueChange={setSegment}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEGMENTS.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="campaign-goal">Objetivo (opcional)</Label>
        <Input
          id="campaign-goal"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          placeholder="Ej. captar 8 fichas nuevas de chalets en 4 semanas"
        />
      </div>

      <Button onClick={run} disabled={loading}>
        {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
        Diseñar campaña
      </Button>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {result && (
        <AiResultPanel
          title={result.title}
          summary={result.summary}
          sections={[
            {
              heading: 'Canales y acciones',
              items: (result.channels || []).map((channel) => `${channel.name}: ${channel.action}`),
            },
            {
              heading: 'Mensajes listos para enviar',
              items: (result.messages || []).map((message) => `${message.channel}\n${message.content}`),
            },
            {
              heading: 'Guion de llamada',
              items: (result.call_script || []).map((step) => `${step.step}: ${step.text}`),
            },
            { heading: 'Esta semana', items: result.first_steps || [] },
          ]}
        />
      )}
    </div>
  );
}