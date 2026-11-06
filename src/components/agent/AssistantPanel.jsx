import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import AgentChat from './AgentChat';

export default function AssistantPanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-4 z-40 flex print:hidden h-[min(560px,calc(100vh-6.5rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/30 sm:right-6">
          <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3.5 py-3">
            <div className="min-w-0">
              <p className="truncate font-heading text-sm font-semibold">Asistente DAN&amp;LOR</p>
              <p className="truncate text-[11px] text-muted-foreground">Clientes, pipeline, tareas y portales</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar asistente"
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <AgentChat />
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente'}
        className="fixed bottom-5 right-4 z-40 flex h-12 items-center gap-2 rounded-full bg-primary print:hidden px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-[1.03] sm:right-6"
      >
        {open ? <X className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        <span className="hidden sm:inline">{open ? 'Cerrar' : 'Asistente'}</span>
      </button>
    </>
  );
}