import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ListingFilters from '@/components/public/ListingFilters';
import PublicPropertyCard from '@/components/public/PublicPropertyCard';

export default function WebListings() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [zone, setZone] = useState('todas');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    base44.functions
      .invoke('websiteProperties', {})
      .then((res) => setProperties(res.data?.properties || []))
      .catch(() => setError('No hemos podido cargar los inmuebles. Inténtalo de nuevo en unos minutos.'))
      .finally(() => setLoading(false));
  }, []);

  const zones = useMemo(
    () =>
      Array.from(new Set(properties.map((item) => item.zone).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'es')
      ),
    [properties]
  );

  const results = useMemo(() => {
    const min = Number(minPrice) || 0;
    const max = Number(maxPrice) || 0;
    return properties.filter((item) => {
      if (zone !== 'todas' && item.zone !== zone) return false;
      const price = Number(item.price) || 0;
      if (min && (!price || price < min)) return false;
      if (max && (!price || price > max)) return false;
      return true;
    });
  }, [properties, zone, minPrice, maxPrice]);

  const clear = () => {
    setZone('todas');
    setMinPrice('');
    setMaxPrice('');
  };

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
          <a href="/login" className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            Acceso equipo
          </a>
        </header>

        <div className="mx-auto max-w-6xl px-5 pb-8 pt-2 sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Cartera actualizada</p>
          <h1 className="mt-3 max-w-2xl font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Busca tu inmueble por zona y precio
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Toda nuestra cartera disponible, actualizada desde el CRM. Filtra por zona y presupuesto y solicita
            información del inmueble que te interese.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <ListingFilters
          zones={zones}
          zone={zone}
          onZone={setZone}
          minPrice={minPrice}
          onMinPrice={setMinPrice}
          maxPrice={maxPrice}
          onMaxPrice={setMaxPrice}
          onClear={clear}
          total={results.length}
        />

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando inmuebles…
          </div>
        ) : error ? (
          <p className="py-16 text-center text-sm text-muted-foreground">{error}</p>
        ) : results.length === 0 ? (
          <div className="card-surface mt-6 p-10 text-center">
            <p className="font-heading text-base font-semibold">
              {properties.length === 0 ? 'Todavía no hay inmuebles publicados' : 'Ningún inmueble coincide con tu búsqueda'}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {properties.length === 0
                ? 'En cuanto publiquemos nuevas propiedades aparecerán aquí automáticamente.'
                : 'Prueba a ampliar el presupuesto o a quitar el filtro de zona.'}
            </p>
            <Link
              to="/captacion"
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Cuéntanos qué buscas
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((property) => (
              <PublicPropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-[11px] text-muted-foreground">
        DAN&amp;LOR · Gestión inmobiliaria
      </footer>
    </div>
  );
}