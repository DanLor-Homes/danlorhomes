import React, { useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createRoomCode, roomUrl } from '@/lib/video';

function nowValue() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function VideoCallDialog({ open, onOpenChange, clients, saving, onCreate }) {
  const [clientId, setClientId] = useState('');
  const [when, setWhen] = useState(nowValue);
  const [room, setRoom] = useState(createRoomCode);

  useEffect(() => {
    if (!open) return;
    setClientId('');
    setWhen(nowValue());
    setRoom(createRoomCode());
  }, [open]);

  const submit = () => {
    if (!clientId) return;
    onCreate({ client_id: clientId, date: new Date(when).toISOString(), room });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva videollamada</DialogTitle>
          <DialogDescription>Crea una sala privada para reunirte con el cliente.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un cliente" />
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
            <Label htmlFor="video-when">Fecha y hora</Label>
            <Input id="video-when" type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Enlace de la sala</Label>
            <div className="flex items-center gap-2">
              <Input value={roomUrl(room)} readOnly className="font-mono text-[11px]" />
              <Button variant="outline" size="icon" onClick={() => setRoom(createRoomCode())} aria-label="Generar otro enlace">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!clientId || saving}>
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Crear y entrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}