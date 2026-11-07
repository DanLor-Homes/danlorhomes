import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { exportClientsCsv } from '@/lib/clientCsv';

export default function ExportClientsButton({ clients, filename = 'clientes', size = 'default', variant = 'outline' }) {
  const { toast } = useToast();
  const total = clients.length;

  const handleExport = () => {
    if (!total) return;
    exportClientsCsv(clients, filename);
    toast({ title: 'Exportación preparada', description: `${total} fichas descargadas en CSV.` });
  };

  return (
    <Button variant={variant} size={size} onClick={handleExport} disabled={total === 0}>
      <Download className="mr-1.5 h-4 w-4" /> Exportar CSV
    </Button>
  );
}