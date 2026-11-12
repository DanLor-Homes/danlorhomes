import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/crm';
import { Building2, Copy, Mail, MessageCircle } from 'lucide-react';

export const sharedListingUrl = (id) => `${window.location.origin}/bolsa/compartida/${id}`;

export default function MlsSharePanel({ listing, partners = [] }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const url = sharedListingUrl(listing.id);
  const shareText = `${listing.title} · ${formatCurrency(listing.price)} · ${listing.zone || ''}\n${url}`;
  const subject = `Inmueble en colaboración: ${listing.title}`;
  const body = `Te comparto este inmueble de la bolsa de la red:\n${url}\n\n${
    listing.commission_notes || ''
  }`.trim();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: 'Enlace copiado' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Copia el enlace manualmente', variant: 'destructive' });
    }
  };

  const agenciesWithEmail = partners.filter((partner) => partner.active !== false && partner.email);

  return (
    <div className="space-y-3 rounded-xl border border-border/70 p-4">
      <div>
        <p className="text-sm font-semibold">Compartir con la red</p>
        <p className="text-xs text-muted-foreground">
          Cualquier agencia con este enlace podrá ver la ficha y solicitar colaboración, aunque no use el CRM.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input value={url} readOnly className="text-xs" onFocus={(event) => event.target.select()} />
        <div className="flex shrink-0 items-center gap-1.5">
          <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={copy}>
            <Copy className="h-3.5 w-3.5" /> {copied ? 'Copiado' : 'Copiar'}
          </Button>
          <Button type="button" size="sm" variant="outline" className="gap-1.5" asChild>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          </Button>
          <Button type="button" size="sm" variant="outline" className="gap-1.5" asChild>
            <a href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}>
              <Mail className="h-3.5 w-3.5" /> Email
            </a>
          </Button>
        </div>
      </div>

      {agenciesWithEmail.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Enviar a una agencia de la red
          </p>
          <div className="flex flex-wrap gap-1.5">
            {agenciesWithEmail.slice(0, 8).map((partner) => (
              <a
                key={partner.id}
                href={`mailto:${partner.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
                  body
                )}`}
                className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2.5 py-1 text-[11px] font-medium transition-colors hover:border-primary/50 hover:text-primary"
              >
                <Building2 className="h-3 w-3" /> {partner.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}