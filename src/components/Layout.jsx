import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Building2,
  Calculator,
  Landmark,
  Mail,
  FileSignature,
  Flame,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  Globe,
  UserRound,
  UserPlus,
  ListChecks,
  CalendarDays,
  BarChart3,
  Megaphone,
  Archive,
  Settings,
  Menu,
  Moon,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import AssistantPanel from '@/components/agent/AssistantPanel';
import NotificationsBell from '@/components/notifications/NotificationsBell';
import QuickLeadDialog from '@/components/leads/QuickLeadDialog';
import brandLogo from '@/assets/danlor-logo.webp';
import SessionCard from '@/components/SessionCard';

const NAV_GROUPS = [
  {
    label: 'Comercial',
    items: [
      { to: '/', label: 'Panel de control', icon: LayoutDashboard },
      { to: '/pipeline', label: 'Pipeline', icon: LayoutGrid },
      { to: '/leads', label: 'Leads y ventas', icon: Flame },
      { to: '/tareas', label: 'Tareas', icon: ListChecks },
      { to: '/calendario', label: 'Calendario', icon: CalendarDays },
    ],
  },
  {
    label: 'Inmuebles',
    items: [
      { to: '/inmuebles', label: 'Inmuebles', icon: Building2 },
      { to: '/propietarios', label: 'Propietarios', icon: KeyRound },
      { to: '/portales', label: 'Portales', icon: Globe },
      { to: '/particulares', label: 'Particulares', icon: UserRound },
      { to: '/tasacion', label: 'Tasación', icon: Calculator },
      { to: '/hipotecas', label: 'Hipotecas', icon: Landmark },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { to: '/contratos', label: 'Documentos', icon: FileSignature },
      { to: '/correo', label: 'Correo', icon: Mail },
      { to: '/informes', label: 'Informes', icon: BarChart3 },
      { to: '/canales', label: 'Canales', icon: Megaphone },
      { to: '/archivo', label: 'Archivo', icon: Archive },
      { to: '/ajustes', label: 'Ajustes', icon: Settings },
    ],
  },
];

const NAV = NAV_GROUPS.flatMap((group) => group.items);

function Brand() {
  return (
    <Link to="/" className="group flex items-center gap-3 px-1 py-1">
      <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/15 transition-transform duration-300 group-hover:scale-[1.03]">
        <img src={brandLogo} alt="DAN&LOR HOMES" className="h-8 w-8 rounded-lg object-contain" />
      </span>
      <span className="leading-tight">
        <span className="block font-heading text-[15px] font-extrabold tracking-tight">DAN&amp;LOR HOMES</span>
        <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Servicios inmobiliarios
        </span>
      </span>
    </Link>
  );
}

function NavItem({ to, label, icon: Icon, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-[13.5px] font-medium outline-none transition-all duration-200',
          'focus-visible:ring-2 focus-visible:ring-ring/60',
          isActive
            ? 'bg-card text-foreground shadow-sm ring-1 ring-border/70'
            : 'text-muted-foreground hover:bg-card/60 hover:text-foreground'
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-all duration-200',
              isActive ? 'opacity-100' : 'opacity-0'
            )}
          />
          <span
            className={cn(
              'grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors',
              isActive ? 'bg-primary/12 text-primary' : 'text-muted-foreground group-hover:text-foreground'
            )}
          >
            <Icon className="h-[17px] w-[17px]" />
          </span>
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

function NavItems({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => (
              <NavItem key={item.to} {...item} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function Layout() {
  const location = useLocation();
  const [dark, setDark] = useState(() => (localStorage.getItem('danlor-theme') || 'dark') === 'dark');
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('danlor-theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const syncTheme = () => setDark((localStorage.getItem('danlor-theme') || 'dark') === 'dark');
    window.addEventListener('danlor-theme-change', syncTheme);
    return () => window.removeEventListener('danlor-theme-change', syncTheme);
  }, []);

  const current = NAV.find((item) => (item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)));

  return (
    <div className="app-canvas min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[268px] flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex print:hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/[0.07] to-transparent" />
        <div className="relative">
          <Brand />
        </div>
        <div className="relative mt-7 flex-1 overflow-y-auto pr-1">
          <NavItems />
        </div>
        <div className="relative mt-4 border-t border-sidebar-border pt-4">
          <SessionCard user={user} />
        </div>
      </aside>

      <div className="lg:pl-[268px] print:pl-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border/60 bg-background/75 px-4 backdrop-blur-xl sm:px-6 lg:px-8 print:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[290px] overflow-y-auto border-sidebar-border bg-sidebar px-4 py-6">
                <Brand />
                <div className="mt-7">
                  <NavItems onNavigate={() => setOpen(false)} />
                  <div className="mt-6 border-t border-sidebar-border pt-4">
                    <SessionCard user={user} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                DAN&amp;LOR HOMES
              </p>
              <h2 className="truncate font-heading text-base font-semibold leading-tight">{current?.label || 'Dashboard'}</h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              className="hidden gap-1.5 rounded-full shadow-sm shadow-primary/20 sm:inline-flex"
              onClick={() => setLeadOpen(true)}
            >
              <UserPlus className="h-4 w-4" /> Nuevo lead
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="rounded-full sm:hidden"
              onClick={() => setLeadOpen(true)}
              aria-label="Nuevo lead"
            >
              <UserPlus className="h-[18px] w-[18px]" />
            </Button>
            <NotificationsBell />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDark((prev) => !prev)}
              aria-label="Cambiar tema"
              className="rounded-full"
            >
              {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </Button>
            <div className="ml-0.5 hidden h-9 w-9 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold uppercase text-primary ring-1 ring-primary/20 sm:grid">
              {(user?.full_name || user?.email || 'DL').slice(0, 2)}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:max-w-none print:p-0">
          <Outlet />
        </main>
      </div>
      <QuickLeadDialog open={leadOpen} onOpenChange={setLeadOpen} />
      <AssistantPanel />
    </div>
  );
}