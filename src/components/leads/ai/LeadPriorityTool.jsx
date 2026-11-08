import React, { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { aiErrorMessage } from '@/lib/aiError';
import { Button } from '@/components/ui/button';
import { daysSince } from '@/lib/crm';
import AiResultPanel from './AiResultPanel';

export default function LeadPriorityTool({ leads }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const candidates = leads
    .filter((lead) => lead.band.id !== 'cold')
    .slice(0, 12)
    .map((lead) => ({
      name: lead.client.name,
      status: lead.client.status,
      zone: lead.client.geographic_zone || lead.client.search_zones,
      score: lead.score,
      days: daysSince(lead.last) ?? 999,
      value: lead.openValue || 0,
    }));

  const run = async () => {
    if (candidates.length === 0) {
      setError('No hay leads activos que analizar.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await base44.functions.invoke('captureAi', { tool: 'qualify', leads: candidates });
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
      <p className="text-xs leading-relaxed text-muted-foreground">
        Analiza los {candidates.length} leads con mejor puntuación, detecta los que están listos para cerrar y propone
        el siguiente contacto exacto.
      </p>

      <Button onClick={run} disabled={loading}>
        {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
        Priorizar mis leads
      </Button>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {result && (
        <AiResultPanel
          title="Prioridades de hoy"
          summary={result.summary}
          sections={[
            {
              heading: 'Leads ordenados',
              items: (result.ranked || []).map(
                (lead) => `${lead.name} · prioridad ${lead.priority}\n${lead.reason}\nSiguiente paso: ${lead.next_action}`
              ),
            },
            { heading: 'Victorias rápidas', items: result.quick_wins || [] },
          ]}
        />
      )}
    </div>
  );
}