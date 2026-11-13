import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import { groupResults, searchCrm } from '@/lib/globalSearch';
import { cn } from '@/lib/utils';

export default function GlobalSearchDialog({ open, onOpenChange }) {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!open) {
      setTerm('');
      setResults([]);
      setActive(0);
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    const query = term.trim();
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const found = await searchCrm(query);
        if (!cancelled) {
          setResults(found);
          setActive(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term]);

  const groups = useMemo(() => groupResults(results), [results]);

  const go = (result) => {
    if (!result) return;
    onOpenChange(false);
    navigate(result.to);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((prev) => (results.length ? (prev + 1) % results.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((prev) => (results.length ? (prev - 1 + results.length) % results.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      go(results[active]);
    }
  };

  let index = -1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[12%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Búsqueda global</DialogTitle>
        <div className="flex items-center gap-2.5 border-b border-border/60 px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar clientes, inmuebles, oportunidades, tareas y leads…"
            className="h-12 border-0 bg-transparent px-0 text-[15px] shadow-none focus-visible:ring-0"
          />
          {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
        </div>

        <div className="max-h-[58vh] overflow-y-auto p-2">
          {term.trim().length < 2 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Escribe al menos dos caracteres para buscar en todo el CRM.
            </p>
          ) : !loading && results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Sin resultados para «{term.trim()}».</p>
          ) : (
            groups.map((group) => (
              <div key={group.kind} className="mb-1 last:mb-0">
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {group.label}
                </p>
                {group.items.map((result) => {
                  index += 1;
                  const position = index;
                  return (
                    <button
                      key={`${result.kind}-${result.id}`}
                      type="button"
                      onMouseEnter={() => setActive(position)}
                      onClick={() => go(result)}
                      className={cn(
                        'flex w-full flex-col items-start gap-0.5 rounded-xl px-3 py-2 text-left transition-colors',
                        position === active ? 'bg-primary/10 text-foreground' : 'hover:bg-accent/60'
                      )}
                    >
                      <span className="w-full truncate text-sm font-semibold">{result.title}</span>
                      {result.subtitle && (
                        <span className="w-full truncate text-xs text-muted-foreground">{result.subtitle}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border/60 px-4 py-2 text-[11px] text-muted-foreground">
          <span>↑ ↓ para moverte · Enter para abrir</span>
          <span>Esc para cerrar</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}