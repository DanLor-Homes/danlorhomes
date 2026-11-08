import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CampaignTool from './CampaignTool';
import OwnerCopyTool from './OwnerCopyTool';
import LeadPriorityTool from './LeadPriorityTool';

export default function CaptureAiPanel({ leads }) {
  const [tab, setTab] = useState('campaign');

  return (
    <Tabs value={tab} onValueChange={setTab} className="card-surface mt-5 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
        <div>
          <h3 className="flex items-center gap-1.5 font-heading text-sm font-bold">
            <Sparkles className="h-4 w-4 text-primary" /> IA de captación
          </h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Campañas, textos para propietarios y priorización de leads.
          </p>
        </div>
        <TabsList>
          <TabsTrigger value="campaign" className="text-[11px]">
            Campañas
          </TabsTrigger>
          <TabsTrigger value="owner" className="text-[11px]">
            Propietarios
          </TabsTrigger>
          <TabsTrigger value="priority" className="text-[11px]">
            Priorizar
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="p-4">
        <TabsContent value="campaign" className="mt-0">
          <CampaignTool />
        </TabsContent>
        <TabsContent value="owner" className="mt-0">
          <OwnerCopyTool />
        </TabsContent>
        <TabsContent value="priority" className="mt-0">
          <LeadPriorityTool leads={leads} />
        </TabsContent>
      </div>
    </Tabs>
  );
}