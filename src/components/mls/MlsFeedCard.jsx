import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { DEFAULT_AGENCY } from '@/lib/mls';
import { buildFeedUrl, newFeedToken } from '@/lib/mlsFeed';
import { Copy, Link2, RefreshCw } from 'lucide-react';

export default function MlsFeedCard() {
  const { toast } = useToast();
  const [feed, setFeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    base44.entities.MlsFeed
      .list({ limit: 1 })
      .then((page) => setFeed((page.items || [])[0] || null))
      .finally(() => setLoading(false));
  }, []);

  const feedUrl = buildFeedUrl(feed?.token);

  const createFeed = async () => {
    setWorking(true);
    try {
      const created = await base44.entities.MlsFeed.create({
        agency: DEFAULT_AGENCY,
        token: newFeedToken(),
        active: true,
      });
      setFeed(created);
      toast({ title: 'Enlace de feed creado', description: 'Compártelo con las agencias de tu red.' });
    } finally {
      setWorking(false);
    }
  };

  const regenerate = async () => {
    setWorking(true);
    try {
      const updated = await base44.entities.MlsFeed.update(feed.id, { token: newFeedToken() });
      setFeed(updated);
      toast({ title: 'Enlace renovado', description: 'El enlace anterior deja de funcionar.' });
    } finally {
      setWorking(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(feedUrl);
    toast({ title: 'Enlace copiado' });
  };

  if (loading) return null;

  return (
    <section className="card-surface space-y-2.5 p-4">
      <div className="flex items-start gap-2">
        <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="font-heading text-[15px] font-semibold leading-tight">Tu enlace de feed</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
            Compártelo con las agencias de tu red para que importen tu cartera disponible y reservada en su CRM.
            Solo sale cartera propia: lo que importas de otras agencias no se reenvía.
          </p>
        </div>
      </div>

      {feed ? (
        <>
          <div className="flex flex-col gap-1.5 sm:flex-row">
            <Input readOnly value={feedUrl} className="text-[12px]" onFocus={(event) => event.target.select()} />
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={copy}>
                <Copy className="h-3.5 w-3.5" /> Copiar
              </Button>
              <Button size="sm" variant="ghost" className="gap-1.5" onClick={regenerate} disabled={working}>
                <RefreshCw className="h-3.5 w-3.5" /> Renovar
              </Button>
            </div>
          </div>
        </>
      ) : (
        <Button size="sm" className="gap-1.5" onClick={createFeed} disabled={working}>
          <Link2 className="h-4 w-4" /> Crear mi enlace de feed
        </Button>
      )}
    </section>
  );
}