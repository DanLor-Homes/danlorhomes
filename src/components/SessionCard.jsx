import React from 'react';
import { LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SessionCard({ user }) {
  const initial = (user?.full_name || user?.email || 'DL').slice(0, 1).toUpperCase();

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-3">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/12 text-[12px] font-semibold text-primary ring-1 ring-primary/15">
          {initial}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Sesión</p>
          <p className="truncate text-[13px] font-medium">{user?.full_name || user?.email || 'Cargando…'}</p>
        </div>
      </div>
      <button
        onClick={() => base44.auth.logout('/login')}
        className="mt-2.5 flex w-full items-center gap-1.5 rounded-lg px-1 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <LogOut className="h-3 w-3" /> Cerrar sesión
      </button>
    </div>
  );
}