import React, { useState } from 'react';
import { Check, Copy, ExternalLink, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCallDate, roomUrl, embedUrl } from '@/lib/video';

export default function VideoRoom({ call, client, onLeave }) {
  const [copied, setCopied] = useState(false);
  const url = roomUrl(call.room);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="card-surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-bold">{client?.name || 'Videollamada'}</p>
          <p className="truncate text-[11px] text-muted-foreground">{formatCallDate(call.date)}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={copy}>
            {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
            Enlace
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Abrir
            </a>
          </Button>
          <Button size="sm" variant="ghost" onClick={onLeave}>
            <LogOut className="mr-1.5 h-3.5 w-3.5" /> Salir
          </Button>
        </div>
      </div>

      <div className="aspect-video w-full bg-black">
        <iframe
          title="Videollamada con el cliente"
          src={embedUrl(call.room, client?.name)}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="h-full w-full border-0"
        />
      </div>
    </section>
  );
}