import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/crm/PageHeader';
import EmptyState from '@/components/crm/EmptyState';
import ValuationControls from '@/components/valuation/ValuationControls';
import AddressValuationForm from '@/components/valuation/AddressValuationForm';
import ValuationResult from '@/components/valuation/ValuationResult';
import ComparableTable from '@/components/valuation/ComparableTable';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/crm';
import { buildValuation, comparablesList, listZones, sampleByPlace, sampleFor, zonesMatch } from '@/lib/valuation';

const MODES = [
  { id: 'cartera', label: 'Inmueble de la cartera' },
  { id: 'direccion', label: 'Tasar por dirección' },
];

const EMPTY_DRAFT = { address: '', municipality: '', province: '', surface: '', property_type: 'piso', operation: 'venta' };

export default function Valuation() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('cartera');
  const [subjectId, setSubjectId] = useState('');
  const [referenceZone, setReferenceZone] = useState('');
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    base44.entities.Property.filter({}, { sort: '-created_date', limit: 500 }).then((res) => {
      const items = res.items || [];
      setProperties(items);
      const fromUrl = new URLSearchParams(window.location.search).get('inmueble');
      const first = items.find((item) => item.id === fromUrl) || items[0];
      if (first) {
        setSubjectId(first.id);
        setReferenceZone(first.reference_zone || '');
      }
      setLoading(false);
    });
  }, []);

  const zones = useMemo(() => listZones(properties), [properties]);

  const subject =
    mode === 'cartera'
      ? properties.find((item) => item.id === subjectId) || null
      : {
          id: 'draft',
          title: [draft.address, draft.municipality].filter(Boolean).join(', ') || 'Inmueble sin registrar',
          address: draft.address,
          municipality: draft.municipality,
          province: draft.province,
          zone: draft.municipality || draft.province || '',
          surface: Number(draft.surface) || 0,
          operation: draft.operation,
          property_type: draft.property_type,
        };

  const own = useMemo(() => {
    if (mode === 'direccion') {
      return sampleByPlace(properties, {
        municipality: draft.municipality,
        province: draft.province,
        operation: draft.operation,
        propertyType: draft.property_type,
      });
    }
    if (!subject) return { rows: [], usedFallback: false, scope: null };
    return {
      ...sampleFor(properties, {
        zone: subject.zone,
        operation: subject.operation || 'venta',
        propertyType: subject.property_type,
        excludeId: subject.id,
      }),
      scope: 'zona',
    };
  }, [properties, subject, mode, draft]);

  const carteraHasReference = Boolean(referenceZone) && !zonesMatch(referenceZone, subject?.zone);

  const carteraReference = useMemo(
    () =>
      subject && mode === 'cartera' && carteraHasReference
        ? sampleFor(properties, {
            zone: referenceZone,
            operation: subject.operation || 'venta',
            propertyType: subject.property_type,
            excludeId: subject.id,
          })
        : { rows: [], usedFallback: false },
    [properties, subject, carteraHasReference, mode]
  );

  const provinceSample = useMemo(
    () =>
      mode === 'direccion'
        ? sampleByPlace(properties, {
            municipality: '',
            province: draft.province,
            operation: draft.operation,
            propertyType: draft.property_type,
          })
        : { rows: [], scope: null },
    [properties, mode, draft]
  );

  const hasReference =
    mode === 'direccion' ? own.scope === 'municipio' && provinceSample.rows.length > 0 : carteraHasReference;

  const reference = mode === 'direccion' ? (hasReference ? provinceSample : { rows: [], scope: null }) : carteraReference;
  const referenceLabel = mode === 'direccion' ? draft.province : referenceZone;

  const valuation = useMemo(
    () => buildValuation({ surface: subject?.surface, own, reference }),
    [subject, own, reference]
  );

  const rows = useMemo(() => comparablesList(own, reference), [own, reference]);

  const selectSubject = (id) => {
    setSubjectId(id);
    const next = properties.find((item) => item.id === id);
    setReferenceZone(next?.reference_zone || '');
  };

  const save = async () => {
    if (!subject || !valuation.estimate) return;
    if (mode === 'direccion' && !draft.municipality.trim() && !draft.province.trim()) {
      toast({ title: 'Falta la ubicación', description: 'Indica al menos el municipio o la provincia.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      if (mode === 'direccion') {
        const created = await base44.entities.Property.create({
          title: subject.title,
          address: draft.address.trim(),
          municipality: draft.municipality.trim(),
          province: draft.province.trim(),
          zone: draft.municipality.trim() || draft.province.trim(),
          operation: draft.operation,
          property_type: draft.property_type,
          surface: Number(draft.surface) || 0,
          status: 'captacion',
          valuation_value: valuation.estimate,
          valuation_price_m2: valuation.pricePerM2,
          valuation_date: today,
        });
        setProperties((list) => [created, ...list]);
        setSubjectId(created.id);
        setMode('cartera');
        setReferenceZone(draft.province.trim());
        setDraft(EMPTY_DRAFT);
        toast({
          title: 'Tasación guardada',
          description: `${created.title}: ${formatCurrency(valuation.estimate)} · inmueble en captación`,
        });
        return;
      }

      await base44.entities.Property.update(subject.id, {
        reference_zone: referenceZone || subject.reference_zone || '',
        valuation_value: valuation.estimate,
        valuation_price_m2: valuation.pricePerM2,
        valuation_date: today,
      });
      setProperties((list) =>
        list.map((item) =>
          item.id === subject.id
            ? {
                ...item,
                reference_zone: referenceZone || item.reference_zone,
                valuation_value: valuation.estimate,
                valuation_price_m2: valuation.pricePerM2,
              }
            : item
        )
      );
      toast({
        title: 'Tasación guardada',
        description: `${subject.title}: ${formatCurrency(valuation.estimate)}`,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Valoración"
        title="Tasación comparativa"
        description="Tasa un inmueble de la cartera o una dirección nueva con los comparables de su municipio y provincia."
      />

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : properties.length === 0 ? (
        <EmptyState
          icon={Calculator}
          title="Sin inmuebles para tasar"
          description="Da de alta inmuebles con precio y superficie para generar comparables de zona."
        />
      ) : (
        <>
          <div className="mb-4 inline-flex gap-1 rounded-full bg-muted p-1">
            {MODES.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMode(tab.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  mode === tab.id ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {mode === 'cartera' ? (
            <ValuationControls
              properties={properties}
              subjectId={subjectId}
              onSubject={selectSubject}
              zones={zones}
              referenceZone={referenceZone}
              onReferenceZone={setReferenceZone}
            />
          ) : (
            <AddressValuationForm draft={draft} onChange={setDraft} />
          )}

          {subject && (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
              <ValuationResult
                subject={subject}
                valuation={valuation}
                referenceZone={referenceLabel}
                hasReference={hasReference}
                saving={saving}
                onSave={save}
              />

              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="font-heading text-sm font-bold">Comparables de la operación</h2>
                  <span className="text-[11px] text-muted-foreground">{rows.length} inmuebles</span>
                </div>
                {mode === 'direccion' && own.scope === 'provincia' && (
                  <p className="mb-2 text-[11px] italic text-muted-foreground">
                    Sin comparables suficientes en {draft.municipality || 'el municipio'}: se usan los de toda la provincia.
                  </p>
                )}
                {own.usedFallback && own.scope !== 'provincia' && (
                  <p className="mb-2 text-[11px] italic text-muted-foreground">
                    Sin suficientes comparables del mismo tipo: se incluyen todos los de la zona.
                  </p>
                )}
                <ComparableTable rows={rows} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}