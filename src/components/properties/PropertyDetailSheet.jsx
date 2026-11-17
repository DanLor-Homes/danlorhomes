import React, { useCallback, useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Image } from '@/components/ui/image';
import {
  BedDouble,
  CalendarDays,
  FileText,
  Loader2,
  MapPin,
  Maximize,
  Pencil,
  Printer,
  Trash2,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatCurrency, formatDate } from '@/lib/crm';
import {
  conditionLabel,
  estimateValuation,
  legalStatusLabel,
  operationLabel,
  portalLabel,
  pricePerM2,
  propertyStatusLabel,
  propertyTypeLabel,
} from '@/lib/properties';
import CatastroShortcut from './CatastroShortcut';
import MatchList from './MatchList';
import PropertyVisits from './PropertyVisits';
import PropertyDescriptionAI from './PropertyDescriptionAI';
import { mandateLabel, mandateStatus } from '@/lib/mandates';

const ROW = 'flex items-center justify-between gap-3 py-2 text-sm';

function SectionLabel({ icon: Icon, children }) {
  return (
    <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      <span className="gold-rule" />
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </p>
  );
}

function FileRow({ label, file, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(file)}
      className="flex w-full items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-2 text-left text-xs transition-colors hover:border-primary/40 hover:bg-muted/40"
    >
      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate">{file.name}</span>
      <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
    </button>
  );
}

export default function PropertyDetailSheet({ property, open, onOpenChange, onEdit, onOpenClient, onChanged, onDelete }) {
  const [clients, setClients] = useState([]);
  const [comparables, setComparables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [clientRes, propertyRes, listingRes] = await Promise.all([
      base44.entities.Client.filter({}, { sort: 'name', limit: 500 }),
      base44.entities.Property.filter({}, { sort: '-created_date', limit: 300 }),
      base44.entities.PortalListing.filter({}, { sort: '-created_date', limit: 300 }),
    ]);
    setClients(clientRes.items || []);
    setComparables([...(propertyRes.items || []), ...(listingRes.items || [])]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open && property?.id) load();
    else setLoading(true);
  }, [open, property?.id, load]);

  useEffect(() => {
    if (open) setError('');
  }, [open]);

  const openFile = async (file) => {
    setError('');
    if (file.file_url) {
      window.open(file.file_url, '_blank');
      return;
    }
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: file.file_uri,
        expires_in: 300,
      });
      window.open(signed_url, '_blank');
    } catch {
      setError('No se ha podido abrir el documento.');
    }
  };

  if (!property) return null;

  const perM2 = pricePerM2(property.price, property.surface);
  const valuation = estimateValuation(property, comparables);
  const photos = property.photos || [];
  const media = [...(property.videos || []), ...(property.floorplans || [])];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-l border-border/80 bg-background sm:max-w-xl">
        <SheetHeader className="text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="display-title text-[26px]">{property.title}</SheetTitle>
              <SheetDescription className="mt-2 flex items-center gap-1.5 text-[12px]">
                <MapPin className="h-3.5 w-3.5" />
                {property.zone || 'Sin zona'} · {propertyTypeLabel(property.property_type)} ·{' '}
                {operationLabel(property.operation)}
              </SheetDescription>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/inmuebles/${property.id}/ficha`, '_blank')}
              >
                <Printer className="mr-1.5 h-3.5 w-3.5" /> Ficha
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.assign(`/tasacion?inmueble=${property.id}`)}
              >
                <TrendingUp className="mr-1.5 h-3.5 w-3.5" /> Tasar
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit?.(property)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 overflow-hidden rounded-2xl ring-1 ring-border/70">
              {photos.slice(0, 3).map((photo, index) => (
                <button
                  key={`${photo.file_url}-${index}`}
                  type="button"
                  onClick={() => openFile(photo)}
                  className={`group overflow-hidden ${index === 0 ? 'col-span-2 row-span-2 h-44' : 'h-[84px]'}`}
                >
                  <Image
                    src={photo.file_url}
                    alt={photo.name || property.title}
                    className="h-full w-full rounded-xl transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="card-surface p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="display-title text-[30px] leading-none tabular-nums">{formatCurrency(property.price)}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  {perM2 ? `${formatCurrency(perM2)}/m² · ` : ''}
                  {property.surface ? `${property.surface} m²` : 'Superficie sin definir'}
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-primary ring-1 ring-primary/15">
                {propertyStatusLabel(property.status)}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/60 pt-3 text-[10px] uppercase tracking-[0.08em]">
              {property.reference && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">Ref. {property.reference}</span>
              )}
              {property.exclusive && (
                <span className="rounded-full bg-gold/15 px-2 py-0.5 font-semibold text-gold">Exclusiva</span>
              )}
              {property.capture_date && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                  Captado {formatDate(property.capture_date)}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { icon: Maximize, value: property.surface ? `${property.surface} m²` : '—', label: 'Construidos' },
              { icon: BedDouble, value: property.rooms || '—', label: 'Habitaciones' },
              { icon: Zap, value: property.energy_rating ? String(property.energy_rating).toUpperCase() : '—', label: 'Energía' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="rounded-xl border border-border/80 bg-card px-2 py-3">
                <Icon className="mx-auto h-3.5 w-3.5 text-gold" />
                <p className="mt-1.5 font-heading text-[15px] font-semibold leading-none tabular-nums">{value}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              <TrendingUp className="h-3 w-3" /> Valoración por comparables
            </p>
            {loading ? (
              <p className="mt-2 text-xs text-muted-foreground">Calculando…</p>
            ) : valuation ? (
              <>
                <p className="mt-2 font-heading text-[19px] font-semibold leading-none tabular-nums">
                  {formatCurrency(valuation.low)} – {formatCurrency(valuation.high)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {valuation.samples} comparables de la zona a {formatCurrency(valuation.median)}/m² · valor medio{' '}
                  {formatCurrency(valuation.estimate)}
                </p>
                {property.price > valuation.high && (
                  <p className="mt-1 text-[11px] font-medium text-chart-4">
                    El precio actual está por encima de la horquilla estimada.
                  </p>
                )}
                {property.price && property.price < valuation.low && (
                  <p className="mt-1 text-[11px] font-medium text-chart-2">
                    El precio está por debajo de la horquilla: buena oportunidad de venta rápida.
                  </p>
                )}
              </>
            ) : (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Necesitamos al menos 2 comparables con superficie y precio en esta zona para calcular la horquilla.
              </p>
            )}
          </div>

          <PropertyDescriptionAI property={property} onChanged={onChanged} />

          {property.features?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {property.features.map((feature) => (
                <span key={feature} className="rounded-full border border-border/80 bg-card px-2.5 py-1 text-[11px] text-muted-foreground">
                  {feature}
                </span>
              ))}
            </div>
          )}

          <Separator />

          <div>
            <SectionLabel>Legal y honorarios</SectionLabel>
            <div className="divide-y divide-border/60">
              <div className={ROW}>
                <span className="text-muted-foreground">Situación legal</span>
                <span className="font-medium">{legalStatusLabel(property.legal_status)}</span>
              </div>
              <div className={ROW}>
                <span className="text-muted-foreground">Conservación</span>
                <span className="font-medium">{conditionLabel(property.condition)}</span>
              </div>
              <div className={ROW}>
                <span className="text-muted-foreground">Mandato</span>
                <span className="font-medium">
                  {mandateLabel(mandateStatus(property).type)}
                  {property.mandate_end ? ` · hasta ${formatDate(property.mandate_end)}` : ''}
                </span>
              </div>
              <div className={ROW}>
                <span className="text-muted-foreground">Honorarios</span>
                <span className="font-medium">
                  {property.commission_percent ? `${property.commission_percent} %` : '—'}
                  {property.commission_notes ? ` · ${property.commission_notes}` : ''}
                </span>
              </div>
              <div className={ROW}>
                <span className="text-muted-foreground">IBI / comunidad</span>
                <span className="font-medium">
                  {property.ibi_annual ? formatCurrency(property.ibi_annual) : '—'} ·{' '}
                  {property.community_fees ? `${formatCurrency(property.community_fees)}/mes` : '—'}
                </span>
              </div>
              <div className={ROW}>
                <span className="text-muted-foreground">Ref. catastral</span>
                <span className="truncate font-mono text-[11px] font-medium">{property.cadastral_reference || '—'}</span>
              </div>
              <div className={ROW}>
                <span className="text-muted-foreground">Propietario</span>
                <span className="truncate font-medium">
                  {property.owner_name || '—'}
                  {property.owner_phone ? ` · ${property.owner_phone}` : ''}
                </span>
              </div>
            </div>
            <CatastroShortcut cadastralReference={property.cadastral_reference} />
            {property.legal_notes && (
              <p className="mt-2 whitespace-pre-wrap rounded-xl bg-muted/30 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                {property.legal_notes}
              </p>
            )}
          </div>

          <Separator />
          <div>
            <SectionLabel icon={MapPin}>Visitas registradas</SectionLabel>
            <PropertyVisits propertyId={property.id} clients={clients} />
          </div>

          {(media.length > 0 || property.documents?.length > 0) && (
            <>
              <Separator />
              <div>
                <SectionLabel>Vídeos, planos y documentos</SectionLabel>
                <div className="space-y-1.5">
                  {(property.videos || []).map((file, index) => (
                    <FileRow key={`v-${index}`} label="Vídeo" file={file} onOpen={openFile} />
                  ))}
                  {(property.floorplans || []).map((file, index) => (
                    <FileRow key={`p-${index}`} label="Plano" file={file} onOpen={openFile} />
                  ))}
                  {(property.documents || []).map((file, index) => (
                    <FileRow key={`d-${index}`} label="Doc" file={file} onOpen={openFile} />
                  ))}
                </div>
                {error && <p className="mt-1.5 text-[11px] text-destructive">{error}</p>}
              </div>
            </>
          )}

          {property.published_portals?.length > 0 && (
            <div>
              <SectionLabel>Difundido en</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {property.published_portals.map((portal) => (
                  <span key={portal} className="rounded-full bg-accent px-2 py-0.5 text-[11px] text-accent-foreground">
                    {portalLabel(portal)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div>
            <SectionLabel icon={CalendarDays}>Demandantes que encajan</SectionLabel>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <MatchList property={property} clients={clients} onOpenClient={onOpenClient} />
            )}
          </div>

          {property.notes && (
            <div>
              <SectionLabel>Notas internas</SectionLabel>
              <p className="whitespace-pre-wrap rounded-xl border border-border/80 bg-muted/30 px-3 py-2.5 text-sm leading-relaxed">
                {property.notes}
              </p>
            </div>
          )}

          <Button variant="ghost" size="sm" className="w-full" onClick={() => { onChanged?.(); load(); }}>
            Actualizar datos
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(property)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Eliminar inmueble
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}