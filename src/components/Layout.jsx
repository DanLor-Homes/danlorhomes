import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  LayoutGrid,
  Globe,
  ListChecks,
  Users,
  CalendarDays,
  BarChart3,
  Megaphone,
  Archive,
  Settings,
  Menu,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/pipeline', label: 'Pipeline', icon: LayoutGrid },
  { to: '/portales', label: 'Portales', icon: Globe },
  { to: '/tareas', label: 'Tareas', icon: ListChecks },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/calendario', label: 'Calendario', icon: CalendarDays },
  { to: '/informes', label: 'Informes', icon: BarChart3 },
  { to: '/canales', label: 'Canales', icon: Megaphone },
  { to: '/archivo', label: 'Archivo', icon: Archive },
  { to: '/ajustes', label: 'Ajustes', icon: Settings },
];

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-3 px-2 py-1">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-sm font-bold tracking-tight text-primary-foreground shadow-lg shadow-primary/25">
        DL
      </span>
      <span className="leading-tight">
        <span className="block font-heading text-[15px] font-extrabold tracking-tight">DAN&amp;LOR</span>
        <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Servicios inmobiliarios
        </span>
      </span>
    </Link>
  );
}

function NavItems({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-primary/12 text-foreground'
                : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-all',
                  isActive ? 'opacity-100' : 'opacity-0'
                )}
              />
              <Icon className={cn('h-[18px] w-[18px] transition-colors', isActive ? 'text-primary' : '')} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Layout() {
  const location = useLocation();
  const [dark, setDark] = useState(() => (localStorage.getItem('danlor-theme') || 'dark') === 'dark');
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

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
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
        <Brand />
        <div className="mt-8 flex-1 overflow-y-auto">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
            Espacio comercial
          </p>
          <NavItems />
        </div>
        <div className="mt-4 rounded-xl border border-border/60 bg-background/40 p-3">
          <p className="text-[11px] font-medium text-muted-foreground">Sesión</p>
          <p className="truncate text-sm font-medium">{user?.full_name || user?.email || 'Cargando…'}</p>
          <button
            onClick={() => base44.auth.logout('/login')}
            className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="h-3 w-3" /> Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] border-sidebar-border bg-sidebar px-4 py-6">
                <Brand />
                <div className="mt-8">
                  <NavItems onNavigate={() => setOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">DAN&amp;LOR</p>
              <h2 className="font-heading text-base font-semibold leading-tight">{current?.label || 'Dashboard'}</h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDark((prev) => !prev)}
              aria-label="Cambiar tema"
              className="rounded-full"
            >
              {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </Button>
            <div className="hidden h-9 w-9 place-items-center rounded-full border border-border/60 bg-card text-[11px] font-semibold uppercase sm:grid">
              {(user?.full_name || user?.email || 'DL').slice(0, 2)}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}