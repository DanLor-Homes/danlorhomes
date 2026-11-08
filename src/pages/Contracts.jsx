import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/crm/PageHeader';
import ContractBuilder from '@/components/contracts/ContractBuilder';
import InvoicesPanel from '@/components/contracts/InvoicesPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Contracts() {
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <PageHeader
        eyebrow="Documentación"
        title="Contratos y facturas"
        description="Genera arras, alquileres, estancias vacacionales y hojas de encargo, emite facturas con IVA y descarga ambos documentos en PDF."
      />

      <Tabs defaultValue="contratos">
        <TabsList className="mb-5">
          <TabsTrigger value="contratos">Contratos</TabsTrigger>
          <TabsTrigger value="facturas">Facturas</TabsTrigger>
        </TabsList>

        <TabsContent value="contratos">
          <ContractBuilder properties={properties} clients={clients} loading={loading} />
        </TabsContent>

        <TabsContent value="facturas">
          <InvoicesPanel properties={properties} clients={clients} />
        </TabsContent>
      </Tabs>
    </div>
  );
}