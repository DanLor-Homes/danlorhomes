import React, { useMemo, useRef, useState } from 'react';
import { Download, FileSignature, Loader2, Printer } from 'lucide-react';
import ContractDocument from './ContractDocument';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CONTRACT_TYPES, buildContract } from '@/lib/contracts';
import { downloadElementAsPdf } from '@/lib/pdf';
import { today } from '@/lib/invoices';

export default function ContractBuilder({ properties = [], clients = [], loading }) {
  const [type, setType] = useState('arras');
  const [propertyId, setPropertyId] = useState('');
  const [clientId, setClientId] = useState('');
  const [date, setDate] = useState(today);
  const [signal, setSignal] = useState('');
  const [months, setMonths] = useState('12');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('');
  const [nightlyRate, setNightlyRate] = useState('');
  const [deposit, setDeposit] = useState('');
  const [downloading, setDownloading] = useState(false);
  const documentRef = useRef(null);

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
      checkIn,
      checkOut,
      guests,
      nightlyRate,
      deposit,
    });
  }, [
    type,
    selectedProperty,
    selectedClient,
    date,
    signal,
    months,
    monthlyRent,
    checkIn,
    checkOut,
    guests,
    nightlyRate,
    deposit,
  ]);

  const handleDownload = async () => {
    if (!documentRef.current) return;
    setDownloading(true);
    try {
      const label = CONTRACT_TYPES.find((item) => item.id === type)?.label || 'contrato';
      await downloadElementAsPdf(documentRef.current, `${label}-${selectedClient?.name || 'inmueble'}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2 print:hidden">
        <Button variant="outline" onClick={() => window.print()} disabled={!doc}>
          <Printer className="mr-1.5 h-4 w-4" /> Imprimir
        </Button>
        <Button onClick={handleDownload} disabled={!doc || downloading}>
          {downloading ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-1.5 h-4 w-4" />
          )}
          Descargar PDF
        </Button>
      </div>

      <div className="mb-6 rounded-2xl border border-border/70 bg-card p-5 print:hidden">
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

            {type === 'vacacional' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="contract-checkin">Entrada</Label>
                  <Input
                    id="contract-checkin"
                    type="date"
                    value={checkIn}
                    onChange={(event) => setCheckIn(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contract-checkout">Salida</Label>
                  <Input
                    id="contract-checkout"
                    type="date"
                    value={checkOut}
                    onChange={(event) => setCheckOut(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contract-guests">Número de ocupantes</Label>
                  <Input
                    id="contract-guests"
                    type="number"
                    min="1"
                    placeholder="2"
                    value={guests}
                    onChange={(event) => setGuests(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contract-nightly">Precio por noche (€)</Label>
                  <Input
                    id="contract-nightly"
                    type="number"
                    min="0"
                    value={nightlyRate}
                    onChange={(event) => setNightlyRate(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contract-deposit">Fianza (€)</Label>
                  <Input
                    id="contract-deposit"
                    type="number"
                    min="0"
                    value={deposit}
                    onChange={(event) => setDeposit(event.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {doc ? (
        <div className="overflow-x-auto rounded-2xl border border-border/70 bg-muted/20 p-2 print:border-0 print:bg-white print:p-0">
          <div ref={documentRef} className="bg-white">
            <ContractDocument doc={doc} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 py-16 text-center print:hidden">
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