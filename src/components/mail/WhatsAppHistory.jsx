import React from 'react';
import { MessageCircle } from 'lucide-react';

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function WhatsAppHistory({ messages, loading }) {
  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-muted" />;
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-sm font-bold">Historial de WhatsApp</h2>
        <span className="text-[11px] text-muted-foreground">{messages.length} mensajes</span>
      </div>

      {!messages.length ? (
        <div className="mt-6 flex flex-col items-center gap-2 py-6 text-center">
          <MessageCircle className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Aún no has escrito por WhatsApp desde aquí.</p>
        </div>
      ) : (
        <ul className="mt-3 max-h-[520px] divide-y divide-border/60 overflow-y-auto">
          {messages.map((item) => (
            <li key={item.id} className="py-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-sm font-semibold">{item.clientName || 'Cliente sin ficha'}</p>
                <p className="flex-none text-[11px] text-muted-foreground">{formatDate(item.date)}</p>
              </div>
              <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">{item.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}