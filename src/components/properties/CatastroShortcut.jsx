import React from 'react';
import { ExternalLink, Landmark } from 'lucide-react';
import { normalizeRc } from '@/lib/catastro';

// Consulta gratuita de datos de la finca en la Sede Electrónica del Catastro.
const catastroUrl = (rc) =>
  rc
    ? `https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCListaBienes.aspx?rc=${encodeURIComponent(rc)}`
    : 'https://www.sedecatastro.gob.es/';

export default function CatastroShortcut({ cadastralReference }) {
  const rc = normalizeRc(cadastralReference);

  return (
    <a
      href={catastroUrl(rc)}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex items-center gap-2 rounded-lg border border-border/70 bg-card px-2.5 py-2 text-left text-xs transition-colors hover:border-primary/40 hover:text-primary"
    >
      <Landmark className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="flex-1">
        <span className="block font-medium">Nota simple gratis</span>
        <span className="block text-[11px] text-muted-foreground">Consulta en Catastro</span>
      </span>
      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
    </a>
  );
}