import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/crm/PageHeader';
import EmptyState from '@/components/crm/EmptyState';
import ValuationControls from '@/components/valuation/ValuationControls';
import ValuationResult from '@/components/valuation/ValuationResult';
import ComparableTable from '@/components/valuation/ComparableTable';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/crm';
import { buildValuation, comparablesList, listZones, sampleFor, zonesMatch } from '@/lib/valuation';

export default function Valuation() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjectId, setSubjectId] = useState('');
  const [referenceZone, setReferenceZone] = useState('');
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

  const subject = properties.find((item) => item.id === subjectId) || null;
  const zones = useMemo(() => listZones(properties), [properties]);
  const hasReference = Boolean(referenceZone) && !zonesMatch(referenceZone, subject?.zone);

  const own = useMemo(
    () =>
      subject
        ? sampleFor(properties, {
            zone: subject.zone,
            operation: subject.operation || 'venta',
            propertyType: subject.property_type,
            excludeId: subject.id,
          })
        : { rows: [], usedFallback: false },
    [properties, subject]
  );

  const reference = useMemo(
    () =>
      subject && hasReference
        ? sampleFor(properties, {
            zone: referenceZone,
            operation: subject.operation || 'venta',
            propertyType: subject.property_type,
            excludeId: subject.id,
          })
        : { rows: [], usedFallback: false },
    [properties, subject, referenceZone, hasReference]
  );

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
    setSaving(true);
    await base44.entities.Property.update(subject.id, {
      reference_zone: hasReference ? referenceZone : subject.reference_zone || '',
      valuation_value: valuation.estimate,
      valuation_price_m2: valuation.pricePerM2,
      valuation_date: new Date().toISOString().slice(0, 10),
    });
    setProperties((list) =>
      list.map((item) =>
        item.id === subject.id
          ? {
              ...item,
              reference_zone: hasReference ? referenceZone : item.reference_zone,
              valuation_value: valuation.estimate,
              valuation_price_m2: valuation.pricePerM2,
            }
          : item
      )
    );
    setSaving(false);
    toast({
      title: 'Tasación guardada',
      description: `${subject.title}: ${formatCurrency(valuation.estimate)}`,
    });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Valoración"
        title="Tasación comparativa"
        description="Valora un inmueble con los comparables de su propia zona y contrástalos con una zona de referencia."
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
          <ValuationControls
            properties={properties}
            subjectId={subjectId}
            onSubject={selectSubject}
            zones={zones}
            referenceZone={referenceZone}
            onReferenceZone={setReferenceZone}
          />

          {subject && (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
              <ValuationResult
                subject={subject}
                valuation={valuation}
                referenceZone={referenceZone}
                hasReference={hasReference}
                saving={saving}
                onSave={save}
              />

              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="font-heading text-sm font-bold">Comparables de la operación</h2>
                  <span className="text-[11px] text-muted-foreground">{rows.length} inmuebles</span>
                </div>
                {own.usedFallback && (
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