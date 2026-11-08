import React, { useState } from 'react';
import { Check, Copy, MessageCircle, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCallDate, roomUrl, whatsappLink } from '@/lib/video';

export default function VideoCallRow({ call, client, onJoin }) {
  const [copied, setCopied] = useState(false);
  const url = roomUrl(call.room);
  const wa = whatsappLink(client?.phone, client?.name, call.room);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 px-4 py-3 last:border-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{client?.name || 'Cliente eliminado'}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {formatCallDate(call.date)} · <span className="font-mono">{call.room}</span>
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <Button size="sm" variant="outline" onClick={copy}>
          {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
          Enlace
        </Button>
        {wa && (
          <Button size="sm" variant="ghost" asChild>
            <a href={wa} target="_blank" rel="noreferrer">
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> WhatsApp
            </a>
          </Button>
        )}
        <Button size="sm" onClick={() => onJoin(call)}>
          <Play className="mr-1.5 h-3.5 w-3.5" /> Entrar
        </Button>
      </div>
    </div>
  );
}