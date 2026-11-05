import React from 'react';
import { LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SessionCard({ user }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-3">
      <p className="text-[11px] font-medium text-muted-foreground">Sesión</p>
      <p className="truncate text-sm font-medium">{user?.full_name || user?.email || 'Cargando…'}</p>
      <button
        onClick={() => base44.auth.logout('/login')}
        className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <LogOut className="h-3 w-3" /> Cerrar sesión
      </button>
    </div>
  );
}