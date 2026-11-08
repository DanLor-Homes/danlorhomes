import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WebEndpointCard({ icon: Icon, title, description, method, url, sample }) {
  const [copied, setCopied] = useState('');

  const copy = async (value, key) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(''), 1600);
  };

  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5">
      <div className="flex items-start gap-2.5">
        {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight">{title}</p>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{description}</p>
        </div>
        <span className="shrink-0 rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
          {method}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-md border border-border/70 bg-background px-2 py-1.5 font-mono text-[11px]">
          {url}
        </code>
        <Button size="sm" variant="outline" onClick={() => copy(url, 'url')} aria-label="Copiar enlace">
          {copied === 'url' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>

      <div className="mt-2 flex items-start gap-2">
        <pre className="max-h-44 min-w-0 flex-1 overflow-auto rounded-md border border-border/70 bg-background p-2 font-mono text-[10.5px] leading-relaxed text-muted-foreground">
          {sample}
        </pre>
        <Button size="sm" variant="ghost" onClick={() => copy(sample, 'sample')} aria-label="Copiar ejemplo">
          {copied === 'sample' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}