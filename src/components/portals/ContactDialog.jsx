import React, { useEffect, useState } from 'react';
import { Copy, Mail, MessageCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { mailtoLink, portalLabel, whatsappLink } from '@/lib/portals';

export default function ContactDialog({ listing, open, onOpenChange, onContacted }) {
  const { toast } = useToast();
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open || !listing) return;
    const firstName = (listing.contact_name || '').split(' ').filter(Boolean)[0];
    setMessage(
      `Hola${firstName ? ` ${firstName}` : ''}, soy de DAN&LOR Servicios Inmobiliarios. He visto el inmueble «${listing.title}» publicado en ${portalLabel(listing.portal)} y quería consultarle si sigue disponible y si podemos hablar estos días. Gracias.`
    );
  }, [open, listing]);

  if (!listing) return null;

  const handleWhatsapp = () => {
    window.open(whatsappLink(listing.contact_phone, message), '_blank', 'noopener');
    onContacted?.(listing, 'whatsapp');
  };

  const handleEmail = () => {
    window.location.href = mailtoLink(listing.contact_email, `Consulta sobre «${listing.title}»`, message);
    onContacted?.(listing, 'email');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast({ title: 'Mensaje copiado', description: 'Pégalo en el formulario de contacto del portal.' });
    } catch {
      toast({ title: 'No se pudo copiar', description: 'Selecciona el texto y cópialo manualmente.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Contactar con el anunciante</DialogTitle>
          <DialogDescription>{listing.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Textarea rows={6} value={message} onChange={(event) => setMessage(event.target.value)} />
          <div className="flex flex-wrap gap-2">
            {listing.contact_phone && (
              <Button size="sm" onClick={handleWhatsapp}>
                <MessageCircle className="h-3.5 w-3.5" /> Enviar por WhatsApp
              </Button>
            )}
            {listing.contact_email && (
              <Button size="sm" variant="outline" onClick={handleEmail}>
                <Mail className="h-3.5 w-3.5" /> Enviar por email
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={handleCopy}>
              <Copy className="h-3.5 w-3.5" /> Copiar mensaje
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Al enviar, el anuncio se marca como contactado y se crea una tarea de seguimiento a 3 días.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}