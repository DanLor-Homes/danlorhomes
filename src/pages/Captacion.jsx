import React from 'react';
import { Building2, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import LeadCaptureForm from '@/components/captacion/LeadCaptureForm';
import MortgageCalculator from '@/components/public/MortgageCalculator';

const BENEFITS = [
  { icon: Sparkles, title: 'Selección personalizada', text: 'Filtramos el mercado y te enviamos solo lo que encaja con tu búsqueda.' },
  { icon: Clock, title: 'Respuesta en 24 h', text: 'Un asesor real analiza tu caso y te llama en menos de un día laborable.' },
  { icon: ShieldCheck, title: 'Sin compromiso', text: 'Sin coste ni obligación: primero hablamos, después decides.' },
];

export default function Captacion() {
  return (
    <div className="min-h-screen bg-background">
      <div className="grid-glow">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </span>
            <div className="leading-none">
              <p className="font-heading text-base font-extrabold tracking-tight">DAN&LOR</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Inmobiliaria</p>
            </div>
          </div>
          <a href="/login" className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            Acceso equipo
          </a>
        </header>

        <main className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-4 sm:px-8 lg:grid-cols-[1fr_460px] lg:gap-14 lg:pt-12">
          <div className="lg:pt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Formulario de captación
            </p>
            <h1 className="mt-3 font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[44px]">
              Encuentra tu próximo inmueble con quien conoce la zona
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Cuéntanos qué buscas —compra o alquiler—, tu zona y tu presupuesto. Cruzamos tu perfil con nuestra
              cartera y con las oportunidades que captamos cada semana.
            </p>

            <ul className="mt-8 space-y-4">
              {BENEFITS.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <item.icon className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-8 text-xs text-muted-foreground">
              ¿Prefieres hablar ahora? Escríbenos y te llamamos nosotros.
            </p>
          </div>

          <div className="lg:pt-2">
            <LeadCaptureForm />
          </div>
        </main>
      </div>

      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <MortgageCalculator />
      </section>

      <footer className="border-t border-border/60 py-6 text-center text-[11px] text-muted-foreground">
        DAN&LOR · Gestión inmobiliaria · Tus datos se usan solo para responder a tu consulta.
      </footer>
    </div>
  );
}