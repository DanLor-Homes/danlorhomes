import React, { useEffect, useState } from 'react';
import { CalendarDays, Check, Loader2, LogOut, Mail, Moon, Sparkles, Sun } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/crm/PageHeader';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { STAGES, STATUS_LABELS } from '@/lib/crm';
import { useToast } from '@/components/ui/use-toast';

const AUTOMATIONS = [
  {
    title: 'Tarea automática por inactividad',
    description: 'Si una oportunidad abierta lleva 7 días sin interacción con el cliente, se genera una tarea de seguimiento.',
  },
  {
    title: 'Alerta de presupuesto sin respuesta',
    description: 'En el dashboard se avisa cuando una oportunidad en «Presupuesto enviado» supera 5 días sin respuesta.',
  },
  {
    title: 'Riesgo de cierre',
    description: 'Se marca con aviso toda oportunidad cuya fecha de cierre estimada está a menos de 3 días.',
  },
  {
    title: 'Archivado a los 30 días',
    description: 'Las oportunidades ganadas o perdidas pasan al archivo 30 días después de su cierre.',
  },
];

export default function Ajustes() {
  const [user, setUser] = useState(null);
  const [dark, setDark] = useState(() => (localStorage.getItem('danlor-theme') || 'dark') === 'dark');
  const [running, setRunning] = useState(false);
  const [gmailRunning, setGmailRunning] = useState(false);
  const [calendarRunning, setCalendarRunning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const applyTheme = (next) => {
    setDark(next);
    localStorage.setItem('danlor-theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
    window.dispatchEvent(new Event('danlor-theme-change'));
  };

  const runAutomations = async () => {
    setRunning(true);
    try {
      const res = await base44.functions.invoke('crmAutomations', {});
      toast({
        title: 'Automatizaciones ejecutadas',
        description: `${res.data?.tasksCreated ?? 0} tareas creadas · ${res.data?.archived ?? 0} archivadas`,
      });
    } catch (error) {
      toast({ title: 'No se pudieron ejecutar', description: error?.message, variant: 'destructive' });
    } finally {
      setRunning(false);
    }
  };

  const runGmail = async () => {
    setGmailRunning(true);
    try {
      const res = await base44.functions.invoke('syncGmail', {});
      toast({
        title: 'Gmail sincronizado',
        description: `${res.data?.synced ?? 0} emails añadidos al histórico del cliente`,
      });
    } catch (error) {
      toast({
        title: 'No se pudo sincronizar Gmail',
        description: 'Conecta tu cuenta de Google para activar la sincronización.',
        variant: 'destructive',
      });
    } finally {
      setGmailRunning(false);
    }
  };

  const runCalendar = async () => {
    setCalendarRunning(true);
    try {
      const res = await base44.functions.invoke('googleCalendarEvents', { days: 30 });
      toast({
        title: 'Calendario sincronizado',
        description: `${res.data?.synced ?? 0} eventos importados`,
      });
    } catch (error) {
      toast({
        title: 'No se pudo sincronizar el calendario',
        description: 'Conecta tu cuenta de Google para activar la sincronización.',
        variant: 'destructive',
      });
    } finally {
      setCalendarRunning(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Configuración"
        title="Ajustes"
        description="Preferencias de la app, reglas del embudo, automatizaciones e integraciones."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="card-surface p-5">
          <h3 className="font-heading text-sm font-bold">Apariencia</h3>
          <p className="mb-4 text-xs text-muted-foreground">El modo oscuro viene activado por defecto.</p>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-3">
            <div className="flex items-center gap-2.5">
              {dark ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-amber-400" />}
              <div>
                <p className="text-sm font-medium leading-tight">Modo oscuro</p>
                <p className="text-[11px] text-muted-foreground">{dark ? 'Activado' : 'Desactivado'}</p>
              </div>
            </div>
            <Switch checked={dark} onCheckedChange={applyTheme} />
          </div>

          <div className="mt-4 rounded-xl border border-border/70 bg-muted/20 p-3 text-xs">
            <p className="font-medium">Identidad visual</p>
            <p className="mt-1 text-muted-foreground">
              Azul corporativo <span className="font-mono text-foreground">#1c71b7</span> · Inter y Plus Jakarta Sans
            </p>
          </div>
        </section>

        <section className="card-surface p-5">
          <h3 className="font-heading text-sm font-bold">Sesión</h3>
          <p className="mb-4 text-xs text-muted-foreground">App privada: solo usuarios invitados pueden acceder.</p>
          <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
            <p className="truncate font-medium">{user?.full_name || 'Usuario'}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email || '—'}</p>
            <p className="text-xs text-muted-foreground">Rol: {user?.role === 'admin' ? 'Administrador' : 'Comercial'}</p>
          </div>
          <Button variant="outline" className="mt-4" onClick={() => base44.auth.logout('/login')}>
            <LogOut className="mr-1.5 h-4 w-4" /> Cerrar sesión
          </Button>
        </section>

        <section className="card-surface overflow-hidden lg:col-span-2">
          <div className="border-b border-border/70 px-5 py-3">
            <h3 className="font-heading text-sm font-bold">Etapas y probabilidades</h3>
          </div>
          <div className="grid grid-cols-3 gap-3 border-b border-border/70 px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Etapa</span>
            <span>Probabilidad</span>
            <span>Estado derivado</span>
          </div>
          {STAGES.map((stage) => (
            <div key={stage.id} className="grid grid-cols-3 items-center gap-3 border-b border-border/50 px-5 py-2 text-xs last:border-0">
              <span className="flex items-center gap-2 font-medium">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} />
                {stage.label}
              </span>
              <span className="text-muted-foreground">{stage.probability}%</span>
              <span className="text-muted-foreground">{STATUS_LABELS[stage.status]}</span>
            </div>
          ))}
        </section>

        <section className="card-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-heading text-sm font-bold">Automatizaciones</h3>
              <p className="text-xs text-muted-foreground">Se ejecutan al abrir el dashboard y bajo demanda.</p>
            </div>
            <Button variant="outline" size="sm" onClick={runAutomations} disabled={running}>
              {running ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
              Ejecutar
            </Button>
          </div>
          <ul className="mt-3 space-y-2.5">
            {AUTOMATIONS.map((item) => (
              <li key={item.title} className="flex gap-2.5">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <div>
                  <p className="text-xs font-medium">{item.title}</p>
                  <p className="text-[11px] leading-snug text-muted-foreground">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-surface p-5">
          <h3 className="font-heading text-sm font-bold">Integraciones de Google</h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Sincroniza el correo y la agenda con el histórico de cada cliente.
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium leading-tight">Sincronizar Gmail</p>
                  <p className="text-[11px] text-muted-foreground">Hilos de email → interacciones</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={runGmail} disabled={gmailRunning}>
                {gmailRunning && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Sincronizar
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium leading-tight">Google Calendar</p>
                  <p className="text-[11px] text-muted-foreground">Reuniones y visitas → interacciones</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={runCalendar} disabled={calendarRunning}>
                {calendarRunning && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Sincronizar
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}