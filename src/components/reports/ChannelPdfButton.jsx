import React, { useEffect, useRef, useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadElementAsPdf } from '@/lib/pdf';
import ChannelReportDocument from '@/components/reports/ChannelReportDocument';

export default function ChannelPdfButton({ channel, stats, opportunities }) {
  const captureRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!rendered || !captureRef.current) return;
    let active = true;
    downloadElementAsPdf(captureRef.current, `informe-canal-${channel.label}`).finally(() => {
      if (!active) return;
      setRendered(false);
      setBusy(false);
    });
    return () => {
      active = false;
    };
  }, [rendered, channel.label]);

  const generate = () => {
    setBusy(true);
    setRendered(true);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1 px-2 text-[11px] text-muted-foreground hover:text-primary"
        onClick={generate}
        disabled={busy}
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileDown className="h-3 w-3" />}
        PDF
      </Button>

      {rendered && (
        <div style={{ position: 'fixed', left: '-10000px', top: 0, pointerEvents: 'none' }} aria-hidden="true">
          <div ref={captureRef} style={{ width: 794 }}>
            <ChannelReportDocument channel={channel} stats={stats} opportunities={opportunities} />
          </div>
        </div>
      )}
    </>
  );
}