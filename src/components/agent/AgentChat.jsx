import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Send, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import MessageBubble from './MessageBubble';

const AGENT = 'asistente_danlor';
const STORAGE_KEY = 'danlor-agent-conversation';

const SUGGESTIONS = [
  '¿Qué tareas tengo pendientes esta semana?',
  'Resume el pipeline y qué oportunidades están frías',
  '¿Hay anuncios nuevos en portales?',
];

export default function AgentChat() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  const startConversation = async (forceNew) => {
    const savedId = forceNew ? null : localStorage.getItem(STORAGE_KEY);
    let conv = null;
    if (savedId) {
      try {
        conv = await base44.agents.getConversation(savedId);
      } catch {
        conv = null;
      }
    }
    if (!conv || conv.agent_name !== AGENT) {
      conv = await base44.agents.createConversation({
        agent_name: AGENT,
        metadata: { name: 'Asistente DAN&LOR', description: 'Consultas y acciones sobre el CRM' },
      });
      localStorage.setItem(STORAGE_KEY, conv.id);
    }
    setConversation(conv);
    setMessages(conv.messages || []);
    return conv.id;
  };

  useEffect(() => {
    let unsubscribe = () => {};
    let active = true;
    let conversationId = null;

    startConversation(false).then((id) => {
      conversationId = id;
      if (!active) return;
      unsubscribe = base44.agents.subscribeToConversation(id, (data) => {
        setMessages(data.messages || []);
        setConversation((prev) => (prev ? { ...prev, messages: data.messages || [] } : prev));
      });
    });

    return () => {
      active = false;
      unsubscribe();
      conversationId = null;
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const send = async (value) => {
    const content = (value ?? input).trim();
    if (!content || busy) return;
    if (!conversation) {
      setError('El asistente se está preparando. Inténtalo en un segundo.');
      return;
    }
    setError('');
    setInput('');
    setBusy(true);
    try {
      await base44.agents.addMessage(conversation, { role: 'user', content });
    } catch {
      setError('No se ha podido enviar el mensaje. Prueba de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const restart = async () => {
    setError('');
    setMessages([]);
    setConversation(null);
    await startConversation(true);
  };

  const thinking = messages.length > 0 && messages[messages.length - 1].role === 'user';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-3.5 py-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Hola, soy tu asistente. Puedo consultar clientes, oportunidades, tareas y anuncios de portales, y
              dejarte hecho lo que necesites: tareas, notas de llamadas o cambios de etapa.
            </p>
            <div className="flex flex-col gap-1.5">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-left text-xs text-foreground/80 transition-colors hover:border-primary/40 hover:bg-accent/40"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <MessageBubble key={message.id || index} message={message} />
        ))}

        {thinking && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Revisando tus datos…
          </p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border/60 bg-background/40 p-2.5">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Escribe tu consulta…"
            className="max-h-28 min-h-[38px] resize-none text-sm"
          />
          <Button
            type="button"
            size="icon"
            onClick={() => send()}
            disabled={busy || !input.trim()}
            aria-label="Enviar mensaje"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <button
          type="button"
          onClick={restart}
          className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw className="h-2.5 w-2.5" /> Nueva conversación
        </button>
      </div>
    </div>
  );
}