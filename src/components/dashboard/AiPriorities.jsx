import React, { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { aiErrorMessage } from '@/lib/aiError';

const URGENCY_LABELS = { alta: 'Alta', media: 'Media', baja: 'Baja' };

const URGENCY_CLASSES = {
  alta: 'text-rose-600 dark:text-rose-300',
  media: 'text-amber-600 dark:text-amber-300',
  baja: 'text-muted-foreground',
};

export default function AiPriorities() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyse = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const response = await base44.functions.invoke('pipelineInsights', {});
      setData(response.data || null);
    } catch (err) {
      setError(aiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ed-sec">
      <div className="ed-sh">
        <div>
          <p className="ed-sc">Inteligencia comercial</p>
          <h3 style={{ marginTop: 6 }}>Prioridades de la semana</h3>
        </div>
        <button type="button" className="ed-btn2" onClick={analyse} disabled={loading}>
          {loading ? 'Analizando…' : data ? 'Actualizar' : 'Analizar con IA'}
        </button>
      </div>

      {loading && (
        <p className="ed-note flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Revisando pipeline, tareas, mandatos y leads fríos…
        </p>
      )}

      {error && <p className="ed-em">{error}</p>}

      {!loading && !data && !error && (
        <p className="ed-em">
          <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />
          Pide un análisis y el asistente ordenará lo que más conviene atender esta semana, con el motivo y el
          siguiente paso de cada asunto.
        </p>
      )}

      {!loading && data && (
        <>
          <p className="ed-n" style={{ marginTop: 10 }}>
            {data.headline}
          </p>
          {data.summary && <p className="ed-sub">{data.summary}</p>}

          <div style={{ marginTop: 12 }}>
            {(data.priorities || []).map((item, index) => (
              <div key={`${item.title}-${index}`} className="ed-tk">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <p className="ed-n">
                    {index + 1}. {item.title}
                  </p>
                  <span className={`ed-sc ${URGENCY_CLASSES[item.urgency] || ''}`}>
                    {URGENCY_LABELS[item.urgency] || item.urgency}
                  </span>
                </div>
                <p className="ed-s">{item.why}</p>
                <p className="ed-s" style={{ color: 'var(--ed-accent-ink)' }}>
                  {item.action}
                </p>
              </div>
            ))}
          </div>

          {data.risks?.length > 0 && (
            <p className="ed-note" style={{ marginTop: 10 }}>
              <b>Avisos:</b> {data.risks.join(' · ')}
            </p>
          )}
        </>
      )}
    </section>
  );
}