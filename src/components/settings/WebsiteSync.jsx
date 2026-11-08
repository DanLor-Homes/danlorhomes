import React, { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import WebEndpointCard from './WebEndpointCard';
import { Button } from '@/components/ui/button';

const APP_URL = 'https://danlor.base44.app';

const LEAD_SAMPLE = `POST /functions/publicLeadIntake
{
  "name": "Ana Ruiz",
  "phone": "600 000 000",
  "email": "ana@ejemplo.com",
  "zone": "Centro",
  "operation": "venta",
  "budget": 250000,
  "property_types": ["piso"],
  "notes": "Busca piso con terraza",
  "consent": true
}`;

const FEED_SAMPLE = `{
  "ok": true,
  "total": 12,
  "properties": [
    {
      "id": "…",
      "reference": "DL-014",
      "title": "Piso reformado en el centro",
      "operation": "venta",
      "type": "piso",
      "price": 239000,
      "surface": 96,
      "rooms": 3,
      "bathrooms": 2,
      "zone": "Centro",
      "municipality": "…",
      "description": "…",
      "photos": ["https://…"]
    }
  ]
}`;

export default function WebsiteSync() {
  const [checking, setChecking] = useState(false);
  const [total, setTotal] = useState(null);
  const [error, setError] = useState('');

  const checkFeed = async () => {
    setChecking(true);
    setError('');
    try {
      const res = await base44.functions.invoke('websiteProperties', {});
      setTotal(res.data?.total ?? 0);
    } catch (err) {
      setError(err?.message || 'No se pudo leer el feed');
      setTotal(null);
    } finally {
      setChecking(false);
    }
  };

  return (
    <section className="card-surface p-5 lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-sm font-bold">Sincronización con la web</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Enlaces permanentes para conectar tu página web con el CRM en ambos sentidos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={checkFeed} disabled={checking}>
            {checking && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Comprobar feed
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href={`${APP_URL}/functions/websiteProperties`} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Abrir
            </a>
          </Button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <WebEndpointCard
          icon={ArrowDownToLine}
          title="Leads de la web al CRM"
          description="Cada envío del formulario crea la ficha del cliente, asigna responsable por zona y genera la tarea de primer contacto."
          method="POST"
          url={`${APP_URL}/functions/publicLeadIntake`}
          sample={LEAD_SAMPLE}
        />
        <WebEndpointCard
          icon={ArrowUpFromLine}
          title="Inmuebles del CRM a la web"
          description="Devuelve en JSON los inmuebles en estado disponible, con fotos y datos públicos. Admite ?operation=venta|alquiler y ?limit=."
          method="GET"
          url={`${APP_URL}/functions/websiteProperties`}
          sample={FEED_SAMPLE}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5 text-[11px] text-muted-foreground">
        <span>
          {total === null
            ? 'Pulsa «Comprobar feed» para ver cuántos inmuebles se están publicando.'
            : `${total} ${total === 1 ? 'inmueble disponible' : 'inmuebles disponibles'} en el feed. Se actualiza solo al guardar cambios en el CRM.`}
          {error ? ` · ${error}` : ''}
        </span>
        <Link to="/leads" className="font-medium text-primary hover:underline">
          Ver leads recibidos
        </Link>
      </div>
    </section>
  );
}