import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Landmark, Loader2, Search } from 'lucide-react';
import { lookupByAddress, lookupByReference } from '@/lib/catastro';
import { cn } from '@/lib/utils';

const STREET_TYPES = [
  { id: 'CL', label: 'Calle' },
  { id: 'AV', label: 'Avenida' },
  { id: 'PZ', label: 'Plaza' },
  { id: 'PS', label: 'Paseo' },
  { id: 'CM', label: 'Camino' },
  { id: 'CTRA', label: 'Carretera' },
  { id: 'RD', label: 'Ronda' },
  { id: 'TR', label: 'Travesía' },
];

const EMPTY_ADDRESS = { province: '', municipality: '', sigla: 'CL', street: '', number: '' };

export default function CatastroLookup({ onApply }) {
  const [mode, setMode] = useState('rc');
  const [rc, setRc] = useState('');
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setField = (key, value) => setAddress((prev) => ({ ...prev, [key]: value }));

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    setCandidates([]);
    try {
      if (mode === 'rc') {
        onApply?.(await lookupByReference(rc));
      } else {
        const results = await lookupByAddress(address);
        if (!results.length) throw new Error('No hay ningún inmueble en esa dirección. Revisa la vía y el número.');
        setCandidates(results);
      }
    } catch (err) {
      setError(err?.message || 'No se ha podido consultar el Catastro.');
    } finally {
      setLoading(false);
    }
  };

  const pickCandidate = async (candidate) => {
    setLoading(true);
    setError('');
    try {
      onApply?.(await lookupByReference(candidate.rc));
      setCandidates([]);
    } catch (err) {
      setError(err?.message || 'No se ha podido cargar ese inmueble.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/5 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
          <Landmark className="h-3 w-3" /> Catastro
        </p>
        <div className="flex gap-1 rounded-lg bg-background/60 p-0.5">
          {[
            { id: 'rc', label: 'Referencia' },
            { id: 'address', label: 'Dirección' },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setMode(option.id);
                setCandidates([]);
                setError('');
              }}
              className={cn(
                'rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors',
                mode === option.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-1 text-[11px] text-muted-foreground">
        Rellena superficie, año, uso y dirección con los datos oficiales del inmueble.
      </p>

      <div className="mt-2.5 space-y-2">
        {mode === 'rc' ? (
          <div className="flex gap-2">
            <Input
              value={rc}
              onChange={(e) => setRc(e.target.value)}
              placeholder="Referencia catastral (20 caracteres)"
              className="font-mono text-xs"
            />
            <Button type="button" variant="secondary" size="sm" onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            </Button>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label htmlFor="cat-province" className="text-[11px]">Provincia</Label>
              <Input id="cat-province" value={address.province} onChange={(e) => setField('province', e.target.value)} placeholder="Málaga" />
            </div>
            <div>
              <Label htmlFor="cat-city" className="text-[11px]">Municipio</Label>
              <Input id="cat-city" value={address.municipality} onChange={(e) => setField('municipality', e.target.value)} placeholder="Estepona" />
            </div>
            <div>
              <Label className="text-[11px]">Tipo de vía</Label>
              <Select value={address.sigla} onValueChange={(value) => setField('sigla', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STREET_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cat-street" className="text-[11px]">Calle</Label>
              <Input id="cat-street" value={address.street} onChange={(e) => setField('street', e.target.value)} placeholder="Real" />
            </div>
            <div>
              <Label htmlFor="cat-number" className="text-[11px]">Número</Label>
              <Input id="cat-number" value={address.number} onChange={(e) => setField('number', e.target.value)} placeholder="14" />
            </div>
            <div className="flex items-end">
              <Button type="button" variant="secondary" size="sm" className="w-full" onClick={handleSearch} disabled={loading}>
                {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Search className="mr-1.5 h-3.5 w-3.5" />}
                Buscar inmuebles
              </Button>
            </div>
          </div>
        )}

        {error && <p className="text-[11px] text-destructive">{error}</p>}

        {candidates.length > 0 && (
          <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
            {candidates.map((candidate) => (
              <button
                key={candidate.rc}
                type="button"
                onClick={() => pickCandidate(candidate)}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/70 bg-card px-2.5 py-1.5 text-left transition-colors hover:border-primary/50"
              >
                <span className="min-w-0 flex-1 truncate text-[11px]">
                  {candidate.address}
                  {candidate.floor ? ` · ${candidate.floor}` : ''}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{candidate.rc}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}