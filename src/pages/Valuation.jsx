import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/crm/PageHeader';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import SubjectForm from '@/components/valuation/SubjectForm';
import ValuationResult from '@/components/valuation/ValuationResult';
import ValuationBreakdown from '@/components/valuation/ValuationBreakdown';
import ComparableTable from '@/components/valuation/ComparableTable';
import ComparableDialog from '@/components/valuation/ComparableDialog';
import { buildValuation, collectComparables, marketReference } from '@/lib/valuation';
import { formatCurrency } from '@/lib/crm';
import { propertyTypeLabel } from '@/lib/properties';

const EMPTY = {
  address: '',
  municipality: '',
  province: '',
  surface: '',
  property_type: 'piso',
  operation: 'venta',
  condition: 'buen_estado',
  year_built: '',
  reference_m2: '',
};

function valuesFrom(property) {
  const town = property.municipality || property.zone || '';
  const reference = marketReference({ municipality: town, province: property.province });
  return {
    address: property.address || '',
    municipality: town,
    province: property.province || '',
    surface: property.surface || '',
    property_type: property.property_type || 'piso',
    operation: property.operation || 'venta',
    condition: property.condition || 'buen_estado',
    year_built: property.year_built || '',
    reference_m2: property.valuation_price_m2 || reference.priceM2 || '',
  };
}

export default function Valuation() {
  const [properties, setProperties] = useState([]);
  const [testigos, setTestigos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('cartera');
  const [subjectId, setSubjectId] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      base44.entities.Property.filter({}, { sort: '-created_date', limit: 500 }),
      base44.entities.ValuationComparable.filter({}, { sort: '-created_date', limit: 500 }),
    ]).then(([propertyPage, comparablePage]) => {
      const items = propertyPage.items || [];
      setProperties(items);
      setTestigos(comparablePage.items || []);
      const fromUrl = new URLSearchParams(window.location.search).get('inmueble');
      const first = items.find((item) => item.id === fromUrl) || items[0];
      if (first) {
        setSubjectId(first.id);
        setForm(valuesFrom(first));
        setMode('cartera');
      } else {
        setMode('nueva');
      }
      setLoading(false);
    });
  }, []);

  const updateForm = (patch) =>
    setForm((prev) => {
      const next = { ...prev, ...patch };
      if ('municipality' in patch || 'province' in patch) {
        const reference = marketReference({ municipality: next.municipality, province: next.province });
        if (reference.priceM2) next.reference_m2 = reference.priceM2;
      }
      return next;
    });

  const market = useMemo(() => {
    const reference = marketReference({ municipality: form.municipality, province: form.province });
    const manual = Number(form.reference_m2) || 0;
    return {
      priceM2: manual || reference.priceM2 || null,
      scope: reference.scope,
      label: reference.label || form.municipality || form.province,
      source: manual && manual !== reference.priceM2 ? 'valor indicado por ti' : reference.source,
    };
  }, [form.municipality, form.province, form.reference_m2]);

  const comparables = useMemo(
    () =>
      collectComparables({
        properties,
        testigos,
        subject: { ...form, id: subjectId, zone: form.municipality || form.province },
        operation: form.operation,
        propertyType: form.property_type,
      }),
    [properties, testigos, form, subjectId]
  );

  const valuation = useMemo(() => buildValuation({ subject: form, comparables, market }), [form, comparables, market]);

  const selectProperty = (id) => {
    const property = properties.find((item) => item.id === id);
    if (!property) return;
    setMode('cartera');
    setSubjectId(id);
    setForm(valuesFrom(property));
  };

  const startNew = () => {
    setMode('nueva');
    setSubjectId('');
    setForm(EMPTY);
  };

  const save = async () => {
    if (!valuation.canValue) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const shared = {
        address: form.address.trim(),
        municipality: form.municipality.trim(),
        province: form.province.trim(),
        zone: form.municipality.trim() || form.province.trim(),
        operation: form.operation,
        property_type: form.property_type,
        surface: Number(form.surface) || 0,
        condition: form.condition || 'buen_estado',
        year_built: Number(form.year_built) || undefined,
        valuation_value: valuation.estimate,
        valuation_price_m2: valuation.pricePerM2,
        valuation_date: today,
      };

      if (mode === 'cartera' && subjectId) {
        await base44.entities.Property.update(subjectId, shared);
        setProperties((list) => list.map((item) => (item.id === subjectId ? { ...item, ...shared } : item)));
        toast({ title: 'Tasación guardada', description: formatCurrency(valuation.estimate) });
      } else {
        const town = form.municipality.trim() || form.province.trim() || 'sin ubicación';
        const created = await base44.entities.Property.create({
          ...shared,
          status: 'captacion',
          title: `${propertyTypeLabel(form.property_type)}${shared.surface ? ` de ${shared.surface} m²` : ''} en ${town}`,
        });
        setProperties((list) => [created, ...list]);
        setSubjectId(created.id);
        setMode('cartera');
        toast({
          title: 'Inmueble creado en captación',
          description: `${created.title}: ${formatCurrency(valuation.estimate)}`,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const removeTestigo = async (id) => {
    await base44.entities.ValuationComparable.delete(id);
    setTestigos((list) => list.filter((item) => item.id !== id));
  };

  const selectedValue = mode === 'cartera' && subjectId ? subjectId : 'nueva';

  return (
    <div>
      <PageHeader
        eyebrow="Valoración"
        title="Tasación de inmuebles"
        description="Compara con los inmuebles de la zona y obtén una valoración razonada del precio de venta o alquiler."
      >
        <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Añadir testigo
        </Button>
      </PageHeader>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              value={selectedValue}
              onValueChange={(value) => (value === 'nueva' ? startNew() : selectProperty(value))}
            >
              <SelectTrigger className="w-full sm:w-[340px]">
                <SelectValue placeholder="Inmueble a tasar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nueva">Nueva tasación (por dirección)</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              {mode === 'cartera' && subjectId
                ? 'Al guardar se actualiza el inmueble de la cartera.'
                : 'Al guardar se crea un inmueble en captación con la tasación.'}
            </span>
          </div>

          <SubjectForm value={form} onChange={updateForm} market={market} />

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
            <div className="space-y-4">
              <ValuationResult valuation={valuation} saving={saving} onSave={save} />
              <ValuationBreakdown valuation={valuation} />
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-heading text-sm font-bold">Comparables de la zona</h2>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {comparables.scope === 'municipio'
                      ? 'Buscando en el municipio del inmueble.'
                      : comparables.scope === 'provincia'
                        ? 'Sin comparables en el municipio: se usa la provincia.'
                        : comparables.scope === 'zona'
                          ? 'Se usa la zona registrada del inmueble.'
                          : 'Sin comparables: añade testigos o ajusta la ubicación.'}
                  </p>
                </div>
                <span className="text-[11px] text-muted-foreground">{comparables.rows.length} inmuebles</span>
              </div>

              {comparables.usedFallback && (
                <p className="mb-2 text-[11px] italic text-muted-foreground">
                  Sin suficientes comparables del mismo tipo: se incluyen todos los de la zona.
                </p>
              )}

              <ComparableTable rows={comparables.rows} onDelete={removeTestigo} />
            </div>
          </div>
        </>
      )}

      <ComparableDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaults={{
          municipality: form.municipality,
          province: form.province,
          property_type: form.property_type,
          operation: form.operation,
          condition: form.condition,
        }}
        onSaved={(record) => setTestigos((list) => [record, ...list])}
      />
    </div>
  );
}