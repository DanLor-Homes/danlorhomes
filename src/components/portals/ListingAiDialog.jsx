import React, { useEffect, useState } from 'react';
import { Copy, Loader2, Mail, MessageCircle, Sparkles, UserPlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { aiErrorMessage } from '@/lib/aiError';
import { mailtoLink, portalLabel, propertyTypeLabel, whatsappLink } from '@/lib/portals';
import { cn } from '@/lib/utils';

const ATTRACTION = {
  alta: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  media: 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300',
  baja: 'border-border bg-muted text-muted-foreground',
};

export default function ListingAiDialog({ listing, open, onOpenChange, onContact, onConvert }) {
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !listing) return;
    let alive = true;
    setAnalysis(null);
    setError('');
    setLoading(true);
    base44.functions
      .invoke('captureAi', {
        tool: 'listing',
        listing: {
          portal: listing.portal,
          title: listing.title,
          operation: listing.operation,
          propertyType: listing.property_type,
          zone: listing.zone,
          price: listing.price,
          surface: listing.surface,
          rooms: listing.rooms,
          bathrooms: listing.bathrooms,
          publishedHint: listing.published_hint,
          description: listing.description,
          contactName: listing.contact_name,
          hasPhone: Boolean(listing.contact_phone),
          hasEmail: Boolean(listing.contact_email),
        },
      })
      .then((response) => {
        if (alive) setAnalysis(response.data || {});
      })
      .catch((err) => {
        if (alive) setError(aiErrorMessage(err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [open, listing]);

  if (!listing) return null;

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} copiado`, description: 'Pégalo en WhatsApp, el correo o el formulario del portal.' });
    } catch {
      toast({ title: 'No se pudo copiar', description: 'Selecciona el texto y cópialo a mano.', variant: 'destructive' });
    }
  };

  const emailText = analysis?.email ? `${analysis.email.subject}\n\n${analysis.email.body}` : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Análisis de captación
          </DialogTitle>
          <DialogDescription>
            {listing.title} · {portalLabel(listing.portal)} · {propertyTypeLabel(listing.property_type)}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Analizando el anuncio y redactando el contacto…
          </p>
        )}
        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</p>
        )}

        {analysis && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-heading text-base font-bold leading-snug">{analysis.headline}</p>
              <span
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  ATTRACTION[analysis.attraction] || ATTRACTION.baja
                )}
              >
                Atractivo {analysis.attraction}
              </span>
            </div>
            <p className="text-muted-foreground">{analysis.summary}</p>

            {(analysis.signals || []).length > 0 && (
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Señales del anuncio</p>
                <ul className="space-y-1.5">
                  {analysis.signals.map((signal) => (
                    <li key={signal.title} className="text-xs leading-relaxed">
                      <span className="font-semibold">{signal.title}: </span>
                      <span className="text-muted-foreground">{signal.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(analysis.angles || []).length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Argumentos de la llamada</p>
                <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed">
                  {analysis.angles.map((angle) => (
                    <li key={angle}>{angle}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Mensaje de WhatsApp</p>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => copy(analysis.whatsapp, 'Mensaje')}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  {listing.contact_phone && (
                    <Button size="sm" variant="ghost" asChild>
                      <a href={whatsappLink(listing.contact_phone, analysis.whatsapp)} target="_blank" rel="noreferrer">
                        <MessageCircle className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              <p className="whitespace-pre-line text-xs leading-relaxed">{analysis.whatsapp}</p>
            </div>

            {analysis.email && (
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Email · {analysis.email.subject}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => copy(emailText, 'Email')}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    {listing.contact_email && (
                      <Button size="sm" variant="ghost" asChild>
                        <a href={mailtoLink(listing.contact_email, analysis.email.subject, analysis.email.body)}>
                          <Mail className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
                <p className="whitespace-pre-line text-xs leading-relaxed">{analysis.email.body}</p>
              </div>
            )}

            {(analysis.call_script || []).length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Guion de llamada</p>
                <ol className="space-y-1.5 text-xs leading-relaxed">
                  {analysis.call_script.map((step, index) => (
                    <li key={step.step}>
                      <span className="font-semibold">
                        {index + 1}. {step.step}:{' '}
                      </span>
                      <span className="text-muted-foreground">{step.text}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {analysis.next_action && (
              <p className="rounded-xl border border-primary/25 bg-primary/5 px-3 py-2 text-xs text-primary">
                Siguiente paso: {analysis.next_action}
              </p>
            )}

            <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
              <Button
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onContact?.(listing);
                }}
              >
                <MessageCircle className="h-3.5 w-3.5" /> Registrar contacto
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  onConvert?.(listing);
                }}
              >
                <UserPlus className="h-3.5 w-3.5" /> Crear cliente
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}