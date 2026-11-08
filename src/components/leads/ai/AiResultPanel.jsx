import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AiResultPanel({ title, summary, sections = [] }) {
  const [copied, setCopied] = useState(false);
  const blocks = sections.filter((section) => section.items?.length);
  const plain = [title, summary, ...blocks.map((section) => `${section.heading}\n${section.items.join('\n')}`)]
    .filter(Boolean)
    .join('\n\n');

  const copy = async () => {
    await navigator.clipboard.writeText(plain);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {title && <p className="font-heading text-sm font-bold">{title}</p>}
          {summary && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{summary}</p>}
        </div>
        <Button size="sm" variant="ghost" onClick={copy} className="shrink-0">
          {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
          Copiar
        </Button>
      </div>

      <div className="mt-3 space-y-3">
        {blocks.map((section) => (
          <div key={section.heading}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {section.heading}
            </p>
            <ul className="mt-1 space-y-1.5">
              {section.items.map((item, index) => (
                <li key={index} className="whitespace-pre-line text-[13px] leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}