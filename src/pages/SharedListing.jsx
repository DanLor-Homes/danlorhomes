import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import SharedListingForm from '@/components/mls/SharedListingForm';
import { formatCurrency, formatDate } from '@/lib/crm';
import { operationLabel, propertyTypeLabel, pricePerM2 } from '@/lib/properties';
import {
  Bath,
  BedDouble,
  Building2,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Maximize,
  Percent,
  Share2,
} from 'lucide-react';

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value || '—'}</p>
    </div>
  );
}

export default function SharedListing() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    base44.functions
      .invoke('mlsShare', { action: 'get', id })
      .then((response) => {
        if (cancelled) return;
        if (response.data?.listing) setListing(response.data.listing);
        else setError(response.data?.error || 'Este inmueble ya no está disponible.');
      })
      .catch(() => {
        if (!cancelled) setError('No hemos podido cargar la ficha. Inténtalo de nuevo en unos minutos.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (loading || listing) return undefined;
    const meta = document.createElement('meta');
    meta.name = 'prerender-status-code';
    meta.content = '404';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, [loading, listing]);

  const photos = listing?.photos || [];
  const perM2 = listing ? pricePerM2(listing.price, listing.surface) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="grid-glow">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
          <Link to="/web" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </span>
            <div className="leading-none">
              <p className="font-heading text-base font-extrabold tracking-tight">DAN&amp;LOR</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Inmobiliaria</p>
            </div>
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <Share2 className="h-3 w-3" /> Bolsa de la red
          </span>
        </header>
      </div>

      <main className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando la ficha…
          </div>
        ) : !listing ? (
          <div className="card-surface mx-auto mt-8 max-w-lg p-10 text-center">
            <p className="font-heading text-base font-semibold">Ficha no disponible</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{error}</p>
            <Link
              to="/web"
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Ver inmuebles disponibles
            </Link>
          </div>
        ) : (
          <div className="mt-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Inmueble compartido en colaboración
            </p>
            <h1 className="mt-2 max-w-3xl font-heading text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
              {listing.title}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" /> {listing.agency}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {listing.zone || listing.municipality || 'Zona a consultar'}
              </span>
              {listing.published_date && <span>Publicado el {formatDate(listing.published_date)}</span>}
            </p>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1.65fr_1fr]">
              <div className="space-y-5">
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted">
                  {photos.length ? (
                    <Image
                      src={photos[Math.min(index, photos.length - 1)].file_url}
                      alt={listing.title}
                      className="aspect-[16/10] w-full"
                    />
                  ) : (
                    <div className="flex aspect-[16/10] w-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                </div>

                {photos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {photos.map((photo, position) => (
                      <button
                        key={`${photo.file_url}-${position}`}
                        type="button"
                        onClick={() => setIndex(position)}
                        className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                          position === index ? 'border-primary' : 'border-transparent'
                        }`}
                      >
                        <Image src={photo.file_url} alt={photo.name || listing.title} className="h-full w-full" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="card-surface flex flex-wrap items-end justify-between gap-3 p-4">
                  <div>
                    <p className="font-heading text-2xl font-bold leading-none">
                      {formatCurrency(listing.price)}
                      {listing.operation === 'alquiler' ? (
                        <span className="text-xs font-medium text-muted-foreground"> /mes</span>
                      ) : null}
                    </p>
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

                <div className="card-surface grid gap-3 p-4 sm:grid-cols-3">
                  <Detail label="Referencia" value={listing.reference} />
                  <Detail label="Municipio" value={listing.municipality} />
                  <Detail label="Zona" value={listing.zone} />
                </div>

                {listing.description && (
                  <div className="card-surface p-4">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Descripción
                    </p>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                      {listing.description}
                    </p>
                  </div>
                )}

                <div className="rounded-2xl border border-primary/25 bg-primary/[0.06] p-4">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">
                    <Percent className="h-3.5 w-3.5" /> Condiciones de colaboración
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {listing.commission_percent
                      ? `${listing.commission_percent} % de honorarios compartidos`
                      : 'Honorarios a convenir'}
                  </p>
                  {listing.commission_notes && (
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {listing.commission_notes}
                    </p>
                  )}
                </div>
              </div>

              <aside className="self-start space-y-4 lg:sticky lg:top-6">
                <div className="card-surface p-5">
                  <p className="font-heading text-base font-semibold">Solicitar colaboración</p>
                  <p className="mb-4 mt-1 text-xs leading-relaxed text-muted-foreground">
                    Presenta a {listing.agency} un cliente interesado o pide más información del inmueble.
                  </p>
                  <SharedListingForm listing={listing} />
                </div>
              </aside>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-[11px] text-muted-foreground">
        DAN&amp;LOR · Ficha compartida de la bolsa inmobiliaria
      </footer>
    </div>
  );
}