import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Pause, Play, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/crm';
import { operationLabel, propertyTypeLabel } from '@/lib/properties';

const ROTATION_MS = 8000;

export default function PropertyPanel() {
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    base44.entities.Property.filter({ status: 'disponible' }, { sort: '-created_date', limit: 50 })
      .then((response) => setItems(response.items || []))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    if (!playing || items.length < 2) return undefined;
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % items.length), ROTATION_MS);
    return () => clearInterval(timer);
  }, [playing, items.length]);

  const move = (step) => {
    if (!items.length) return;
    setIndex((prev) => (prev + step + items.length) % items.length);
  };

  const current = items[index];

  if (!items.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-center">
        <p className="font-heading text-xl font-bold">Sin inmuebles disponibles</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Marca inmuebles como «Disponible» para que aparezcan en el panel.
        </p>
        <Button variant="outline" onClick={() => window.close()}>
          Cerrar
        </Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.2fr_1fr]">
        <div className="relative h-[52vh] lg:h-auto bg-muted">
          {(current.photos || [])[0]?.file_url && (
            <Image
              src={current.photos[0].file_url}
              alt={current.title}
              fittingType="fill"
              className="h-full w-full"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />
          <p className="absolute bottom-5 left-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
            {operationLabel(current.operation)} · {propertyTypeLabel(current.property_type)}
          </p>
        </div>

        <div className="flex flex-col justify-center gap-5 px-8 py-10 lg:px-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            {current.zone || 'Zona sin definir'}
          </p>
          <h1 className="font-heading text-3xl font-extrabold leading-tight lg:text-5xl">{current.title}</h1>
          <p className="font-heading text-4xl font-extrabold text-primary lg:text-6xl">{formatCurrency(current.price)}</p>

          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            {current.surface && <span>{current.surface} m²</span>}
            {current.rooms && <span>{current.rooms} hab.</span>}
            {current.bathrooms && <span>{current.bathrooms} baños</span>}
            {current.reference && <span className="font-mono text-xs">Ref. {current.reference}</span>}
          </div>

          {current.description && (
            <p className="line-clamp-4 max-w-xl text-sm leading-relaxed text-muted-foreground">{current.description}</p>
          )}

          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-primary/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
              DAN&amp;LOR HOMES
            </span>
            <span className="text-[11px] text-muted-foreground">
              {index + 1} / {items.length}
            </span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 flex items-center gap-1.5 rounded-full border border-border/70 bg-card/90 p-1.5 backdrop-blur">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => move(-1)} aria-label="Anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => setPlaying((prev) => !prev)}
          aria-label={playing ? 'Pausar' : 'Reproducir'}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => move(1)} aria-label="Siguiente">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => document.documentElement.requestFullscreen?.()}
          aria-label="Pantalla completa"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => window.location.assign('/inmuebles')}
          aria-label="Salir"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}