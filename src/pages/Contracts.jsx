import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FileSignature, Loader2, Printer } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/crm/PageHeader';
import ContractDocument from '@/components/contracts/ContractDocument';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CONTRACT_TYPES, buildContract } from '@/lib/contracts';

const today = () => new Date().toISOString().slice(0, 10);

export default function Contracts() {
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('arras');
  const [propertyId, setPropertyId] = useState('');
  const [clientId, setClientId] = useState('');
  const [date, setDate] = useState(today);
  const [signal, setSignal] = useState('');
  const [months, setMonths] = useState('12');
  const [monthlyRent, setMonthlyRent] = useState('');

  const load = useCallback(async () => {
    const [propertyRes, clientRes] = await Promise.all([
      base44.entities.Property.filter({}, { sort: '-created_date', limit: 300 }),
      base44.entities.Client.filter({}, { sort: 'name', limit: 500 }),
    ]);
    setProperties(propertyRes.items || []);
    setClients(clientRes.items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selectedProperty = properties.find((item) => item.id === propertyId);
  const selectedClient = clients.find((item) => item.id === clientId);

  const doc = useMemo(() => {
    if (!selectedProperty) return null;
    return buildContract({
      type,
      property: selectedProperty,
      client: selectedClient,
      date,
      signal,
      months,
      monthlyRent,
    });
  }, [type, selectedProperty, selectedClient, date, signal, months, monthlyRent]);

  return (
    <div>
      <div className="print:hidden">
        <PageHeader
          eyebrow="Documentación"
          title="Contratos"
          description="Genera arras, contratos de alquiler y hojas de encargo con los datos del inmueble y del cliente."
        >
          <Button onClick={() => window.print()} disabled={!doc}>
            <Printer className="mr-1.5 h-4 w-4" /> Imprimir o guardar PDF
          </Button>
        </PageHeader>

        <div className="mb-6 rounded-2xl border border-border/70 bg-card p-5">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-1.5">
                <Label>Tipo de documento</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPES.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Inmueble</Label>
                <Select value={propertyId} onValueChange={setPropertyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona inmueble" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>{type === 'encargo' ? 'Propietario (opcional)' : 'Cliente'}</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contract-date">Fecha del documento</Label>
                <Input id="contract-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </div>

              {type === 'arras' && (
                <div className="space-y-1.5">
                  <Label htmlFor="contract-signal">Señal entregada (€)</Label>
                  <Input
                    id="contract-signal"
                    type="number"
                    min="0"
                    placeholder={
                      selectedProperty?.price ? String(Math.round(selectedProperty.price * 0.1)) : '10 % del precio'
                    }
                    value={signal}
                    onChange={(event) => setSignal(event.target.value)}
                  />
                </div>
              )}

              {type === 'alquiler' && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="contract-rent">Renta mensual (€)</Label>
                    <Input
                      id="contract-rent"
                      type="number"
                      min="0"
                      placeholder={selectedProperty?.price ? String(selectedProperty.price) : '0'}
                      value={monthlyRent}
                      onChange={(event) => setMonthlyRent(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contract-months">Duración (meses)</Label>
                    <Input
                      id="contract-months"
                      type="number"
                      min="1"
                      value={months}
                      onChange={(event) => setMonths(event.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {doc ? (
        <div className="overflow-x-auto rounded-2xl border border-border/70 bg-muted/20 p-2 print:border-0 print:bg-white print:p-0">
          <ContractDocument doc={doc} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 py-16 text-center">
          <FileSignature className="h-7 w-7 text-muted-foreground" />
          <p className="text-sm font-medium">Selecciona un inmueble para generar el documento</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Los datos del inmueble y del cliente se completan automáticamente en la plantilla.
          </p>
        </div>
      )}
    </div>
  );
}