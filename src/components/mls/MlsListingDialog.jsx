import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Image } from '@/components/ui/image';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatDate } from '@/lib/crm';
import { operationLabel, propertyTypeLabel, pricePerM2 } from '@/lib/properties';
import { INTEREST_STATUS_STYLES, interestStatusLabel, DEFAULT_AGENCY } from '@/lib/mls';
import MlsStatusSelect from '@/components/mls/MlsStatusSelect';
import {
  Bath,
  BedDouble,
  Building2,
  Check,
  Mail,
  MapPin,
  Maximize,
  MessageSquare,
  Percent,
  Phone,
  Send,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value || '—'}</p>
    </div>
  );
}

export default function MlsListingDialog({ listing, onClose, isMine, interests = [], user, onChanged }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ agent_name: '', agency: '', email: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!listing) return;
    setSent(false);
    setForm({
      agent_name: user?.full_name || '',
      agency: '',
      email: user?.email || '',
      phone: '',
      message: `Hola, me interesa el inmueble «${listing.title}». ¿Podemos hablar de las condiciones de colaboración?`,
    });
  }, [listing, user]);

  if (!listing) return null;

  const photo = listing.photos?.[0]?.file_url;
  const perM2 = pricePerM2(listing.price, listing.surface);

  const handleStatus = async (item, status) => {
    await base44.entities.MlsListing.update(item.id, { status });
    toast({ title: 'Estado actualizado en la bolsa' });
    onChanged?.();
  };

  const handleDelete = async () => {
    await base44.entities.MlsListing.delete(listing.id);
    toast({ title: 'Inmueble retirado de la bolsa' });
    onClose();
    onChanged?.();
  };

  const handleInterest = async (event) => {
    event.preventDefault();
    if (!form.agency.trim() || (!form.email.trim() && !form.phone.trim())) {
      toast({ title: 'Indica tu agencia y un email o teléfono', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      await base44.entities.MlsInterest.create({
        mls_listing_id: listing.id,
        listing_title: listing.title,
        agency: form.agency.trim(),
        agent_name: form.agent_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
        status: 'nuevo',
      });
      setSent(true);
      toast({ title: 'Solicitud enviada a la agencia' });
      onChanged?.();
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="pr-6 font-heading text-xl">{listing.title}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" /> {listing.agency}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {listing.zone || listing.municipality || 'Sin zona'}
            </span>
            {listing.published_date && <span>Publicado el {formatDate(listing.published_date)}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {photo && (
            <div className="overflow-hidden rounded-xl border border-border/70 bg-muted">
              <Image src={photo} alt={listing.title} className="aspect-[16/9] w-full" />
            </div>
          )}

          <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-border/70 bg-muted/40 p-4">
            <div>
              <p className="font-heading text-2xl font-bold leading-none">{formatCurrency(listing.price)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {operationLabel(listing.operation)} · {propertyTypeLabel(listing.property_type)}
                {perM2 ? ` · ${formatCurrency(perM2)}/m²` : ''}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {listing.surface ? (
                <span className="flex items-center gap-1">
                  <Maximize className="h-3.5 w-3.5" /> {listing.surface} m²
                </span>
              ) : null}
              {listing.rooms ? (
                <span className="flex items-center gap-1">
                  <BedDouble className="h-3.5 w-3.5" /> {listing.rooms} hab.
                </span>
              ) : null}
              {listing.bathrooms ? (
                <span className="flex items-center gap-1">
                  <Bath className="h-3.5 w-3.5" /> {listing.bathrooms} baños
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Referencia" value={listing.reference} />
            <Field label="Municipio" value={listing.municipality} />
            <Field label="Zona" value={listing.zone} />
          </div>

          {listing.description && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Descripción
              </p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                {listing.description}
              </p>
            </div>
          )}

          <div className="rounded-xl border border-primary/25 bg-primary/[0.06] p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">
              <Percent className="h-3.5 w-3.5" /> Condiciones de colaboración
            </p>
            <p className="mt-1 text-sm font-semibold">
              {listing.commission_percent
                ? `${listing.commission_percent} % de honorarios compartidos`
                : 'Honorarios a convenir'}
            </p>
            {listing.commission_notes && (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{listing.commission_notes}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border/70 p-4 text-xs">
            <span className="font-medium">{listing.agent_name || listing.agency}</span>
            {listing.agent_email && (
              <a href={`mailto:${listing.agent_email}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                <Mail className="h-3.5 w-3.5" /> {listing.agent_email}
              </a>
            )}
            {listing.agent_phone && (
              <a href={`tel:${listing.agent_phone}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                <Phone className="h-3.5 w-3.5" /> {listing.agent_phone}
              </a>
            )}
          </div>

          {isMine ? (
            <div className="space-y-3 border-t border-border/70 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Tu publicación en la bolsa</p>
                  <p className="text-xs text-muted-foreground">Cambia el estado para avisar a la red.</p>
                </div>
                <div className="flex items-center gap-2">
                  <MlsStatusSelect listing={listing} onChange={handleStatus} />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5 text-destructive">
                        <Trash2 className="h-3.5 w-3.5" /> Retirar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Retirar de la bolsa?</AlertDialogTitle>
                        <AlertDialogDescription>
                          El inmueble dejará de estar visible para el resto de la red. El inmueble original de
                          tu cartera no se modifica.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Retirar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                  <MessageSquare className="h-4 w-4" /> Solicitudes recibidas ({interests.length})
                </p>
                {interests.length === 0 ? (
                  <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                    Todavía no hay otras agencias interesadas en este inmueble.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {interests.map((interest) => (
                      <div key={interest.id} className="rounded-lg border border-border/70 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold">{interest.agency}</p>
                          <span
                            className={cn(
                              'rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                              INTEREST_STATUS_STYLES[interest.status] || 'bg-muted text-muted-foreground'
                            )}
                          >
                            {interestStatusLabel(interest.status)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {[interest.agent_name, interest.email, interest.phone].filter(Boolean).join(' · ')}
                        </p>
                        {interest.message && <p className="mt-1 text-xs leading-relaxed">{interest.message}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : sent ? (
            <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/[0.08] p-4 text-sm">
              <Check className="h-4 w-4 text-primary" /> Solicitud enviada. La agencia responsable te contactará.
            </div>
          ) : (
            <form onSubmit={handleInterest} className="space-y-3 border-t border-border/70 pt-4">
              <div>
                <p className="text-sm font-semibold">Solicitar información a {listing.agency}</p>
                <p className="text-xs text-muted-foreground">
                  Deja tus datos para coordinar la visita con un cliente de tu cartera.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="mls-agency">Tu agencia</Label>
                  <Input
                    id="mls-agency"
                    value={form.agency}
                    onChange={(event) => setForm({ ...form, agency: event.target.value })}
                    placeholder={DEFAULT_AGENCY}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mls-agent">Persona de contacto</Label>
                  <Input
                    id="mls-agent"
                    value={form.agent_name}
                    onChange={(event) => setForm({ ...form, agent_name: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mls-email">Email</Label>
                  <Input
                    id="mls-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mls-phone">Teléfono</Label>
                  <Input
                    id="mls-phone"
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mls-message">Mensaje</Label>
                <Textarea
                  id="mls-message"
                  rows={3}
                  value={form.message}
                  onChange={(event) => setForm({ ...form, message: event.target.value })}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm" className="gap-1.5" disabled={sending}>
                  <Send className="h-3.5 w-3.5" /> {sending ? 'Enviando…' : 'Enviar solicitud'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}