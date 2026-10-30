import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_LABEL = {
  pending: 'En curso',
  running: 'En curso',
  in_progress: 'En curso',
  completed: 'Listo',
  success: 'Listo',
  failed: 'Error',
  error: 'Error',
};

const pretty = (value) => {
  if (!value) return '';
  try {
    return JSON.stringify(typeof value === 'string' ? JSON.parse(value) : value, null, 2);
  } catch {
    return String(value);
  }
};

function ToolCall({ toolCall }) {
  const [open, setOpen] = useState(false);
  const projection = toolCall.display_projection || {};
  const failed = ['failed', 'error'].includes(toolCall.status);
  const label = failed
    ? projection.error_label || 'No se pudo completar'
    : STATUS_LABEL[toolCall.status] || 'En curso';
  const hidden = projection.hide_details && projection.details_redacted;

  return (
    <div className="mt-1.5 rounded-lg border border-border/60 bg-background/50 px-2.5 py-1.5 text-[11px]">
      <button
        type="button"
        onClick={() => !hidden && setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 text-left text-muted-foreground"
      >
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', failed ? 'bg-destructive' : 'bg-primary')} />
        <span className="truncate font-medium text-foreground/80">
          {projection.label || toolCall.name}
        </span>
        <span className="ml-auto shrink-0">{label}</span>
        {!hidden && <ChevronDown className={cn('h-3 w-3 shrink-0 transition-transform', open && 'rotate-180')} />}
      </button>
      {open && !hidden && (
        <div className="mt-2 space-y-1.5 border-t border-border/60 pt-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
          <p className="whitespace-pre-wrap break-words">{pretty(toolCall.arguments_string) || 'Sin parámetros'}</p>
          {toolCall.results && (
            <p className="max-h-32 overflow-y-auto whitespace-pre-wrap break-words border-t border-border/40 pt-1.5">
              {pretty(toolCall.results)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm',
          isUser ? 'bg-primary text-primary-foreground' : 'border border-border/60 bg-card text-foreground'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="space-y-1 [&_a]:text-primary [&_a]:underline [&_li]:ml-4 [&_li]:list-disc [&_p]:leading-relaxed [&_strong]:font-semibold">
            {message.content ? (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            ) : (
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:120ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:240ms]" />
              </span>
            )}
            {message.tool_calls?.map((toolCall, index) => (
              <ToolCall key={index} toolCall={toolCall} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}