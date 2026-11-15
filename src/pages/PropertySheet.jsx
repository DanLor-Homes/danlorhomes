import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, MapPin, Printer } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import CatastroShortcut from '@/components/properties/CatastroShortcut';
import { formatCurrency, formatDate } from '@/lib/crm';
import {
  conditionLabel,
  energyLabel,
  legalStatusLabel,
  operationLabel,
  pricePerM2,
  propertyStatusLabel,
  propertyTypeLabel,
} from '@/lib/properties';

export default function PropertySheet() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    base44.entities.Property.get(id)
      .then((record) => active && setProperty(record))
      .catch(() => active && setProperty(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (loading || property) return undefined;
    const meta = document.createElement('meta');
    meta.name = 'prerender-status-code';
    meta.content = '404';
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, [loading, property]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white text-center text-slate-900">
        <p className="font-heading text-lg font-bold">Inmueble no encontrado</p>
        <p className="text-sm text-slate-500">Puede que se haya eliminado o retirado de la cartera.</p>
        <Button variant="outline" onClick={() => window.location.assign('/inmuebles')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Volver a inmuebles
        </Button>
      </div>
    );
  }

  const photos = (property.photos || []).slice(0, 4);
  const perM2 = pricePerM2(property.price, property.surface);

  const DATA = [
    ['Referencia', property.reference || '—'],
    ['Operación', operationLabel(property.operation)],
    ['Tipo', propertyTypeLabel(property.property_type)],
    ['Estado', propertyStatusLabel(property.status)],
    ['Superficie', property.surface ? `${property.surface} m²` : '—'],
    ['Superficie útil', property.useful_surface ? `${property.useful_surface} m²` : '—'],
    ['Habitaciones', property.rooms || '—'],
    ['Baños', property.bathrooms || '—'],
    ['Planta', property.floor || '—'],
    ['Año', property.year_built || '—'],
    ['Conservación', conditionLabel(property.condition)],
    ['Energía', energyLabel(property.energy_rating)],
    ['IBI anual', property.ibi_annual ? formatCurrency(property.ibi_annual) : '—'],
    ['Comunidad', property.community_fees ? `${formatCurrency(property.community_fees)}/mes` : '—'],
    ['Situación legal', legalStatusLabel(property.legal_status)],
    ['Fecha de captación', property.capture_date ? formatDate(property.capture_date) : '—'],
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto w-full max-w-[900px] px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
          <Button variant="ghost" size="sm" onClick={() => window.location.assign('/inmuebles')}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Inmuebles
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" /> Imprimir ficha
          </Button>
        </div>

        <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="font-heading text-lg font-extrabold tracking-tight">DAN&amp;LOR HOMES</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Servicios inmobiliarios</p>
          </div>
          <div className="text-right text-[11px] text-slate-500">
            <p>Ficha del inmueble</p>
            <p>{new Date().toLocaleDateString('es-ES')}</p>
          </div>
        </header>

        {photos.length > 0 && (
          <div className="mt-5 grid grid-cols-3 gap-1.5 overflow-hidden rounded-xl">
            {photos.map((photo, index) => (
              <Image
                key={`${photo.file_url}-${index}`}
                src={photo.file_url}
                alt={photo.name || property.title}
                className={index === 0 ? 'col-span-2 row-span-2 h-64' : 'h-[124px]'}
              />
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-extrabold leading-tight">{property.title}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              {[property.address, property.zone].filter(Boolean).join(' · ') || 'Ubicación sin definir'}
            </p>
          </div>
          <div className="text-right">
            <p className="font-heading text-2xl font-extrabold leading-none">{formatCurrency(property.price)}</p>
            {perM2 && <p className="mt-1 text-[11px] text-slate-500">{formatCurrency(perM2)}/m²</p>}
          </div>
        </div>

        {property.description && (
          <p className="mt-4 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">{property.description}</p>
        )}

        {property.features?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {property.features.map((feature) => (
              <span key={feature} className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600">
                {feature}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-1 border-t border-slate-200 pt-4 sm:grid-cols-3">
          {DATA.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-2 border-b border-slate-100 py-1.5 text-[12px]">
              <span className="text-slate-500">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end print:hidden">
          <CatastroShortcut
            cadastralReference={property.cadastral_reference}
            className="mt-0 border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-900"
          />
        </div>

        <footer className="mt-8 border-t border-slate-200 pt-3 text-[10px] leading-relaxed text-slate-500">
          DAN&amp;LOR HOMES · Información orientativa sujeta a verificación. Los datos de este documento no constituyen
          oferta vinculante.
        </footer>
      </div>
    </div>
  );
}