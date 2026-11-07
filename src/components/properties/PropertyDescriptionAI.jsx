import React, { useEffect, useState } from 'react';
import { Check, Copy, Loader2, Save, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { aiErrorMessage } from '@/lib/aiError';

export default function PropertyDescriptionAI({ property, onChanged }) {
  const { toast } = useToast();
  const [draft, setDraft] = useState('');
  const [highlights, setHighlights] = useState([]);
  const [socialPost, setSocialPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft('');
    setHighlights([]);
    setSocialPost('');
    setError('');
  }, [property?.id]);

  const generate = async () => {
    if (loading || !property?.id) return;
    setLoading(true);
    setError('');
    try {
      const response = await base44.functions.invoke('propertyDescription', { propertyId: property.id });
      setDraft(response.data?.description || '');
      setHighlights(response.data?.highlights || []);
      setSocialPost(response.data?.social_post || '');
    } catch (err) {
      setError(aiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast({ title: 'Texto copiado' });
  };

  const save = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    setError('');
    try {
      await base44.entities.Property.update(property.id, { description: draft.trim() });
      toast({ title: 'Descripción guardada en la ficha' });
      await onChanged?.();
    } catch {
      setError('No se ha podido guardar la descripción. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3 w-3" /> Descripción para portales
        </p>
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={generate} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="mr-1.5 h-3 w-3" />
          )}
          {loading ? 'Redactando…' : draft ? 'Volver a redactar' : 'Redactar con IA'}
        </Button>
      </div>

      {error && <p className="mt-1.5 text-[11px] text-destructive">{error}</p>}

      {!draft && property.description && (
        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{property.description}</p>
      )}

      {!draft && !property.description && !loading && !error && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Todavía no hay descripción. La IA la redacta con los datos de la ficha y los precios de la zona; luego puedes
          editarla antes de guardar.
        </p>
      )}

      {draft && (
        <div className="mt-2 space-y-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={8}
            className="resize-none text-sm leading-relaxed"
          />

          {highlights.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Puntos clave</p>
              <ul className="space-y-0.5">
                {highlights.map((item) => (
                  <li key={item} className="flex gap-1.5 text-xs leading-snug">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {socialPost && (
            <div>
              <p className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Post para redes
                <button
                  type="button"
                  onClick={() => copy(socialPost)}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
                >
                  <Copy className="h-2.5 w-2.5" /> Copiar
                </button>
              </p>
              <p className="whitespace-pre-wrap rounded-lg border border-border/70 bg-muted/20 px-2.5 py-2 text-xs leading-relaxed">
                {socialPost}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" className="h-7 text-xs" onClick={save} disabled={saving || !draft.trim()}>
              {saving ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Save className="mr-1.5 h-3 w-3" />}
              Guardar en la ficha
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => copy(draft)}>
              <Copy className="mr-1.5 h-3 w-3" /> Copiar descripción
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}