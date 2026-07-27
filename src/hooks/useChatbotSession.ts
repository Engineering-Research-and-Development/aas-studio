import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@/api/tokenStore';
import { config } from '@/utils/config';

// Minimal client for the Chainlit websocket protocol (AAS_chatbot backend).
// Deliberately hand-rolled: the official @chainlit/react-client pins React 18 +
// Recoil, which this app (React 19) cannot take on. Protocol reference:
// chainlit backend/chainlit/socket.py and libs/react-client/useChatSession.ts.

export type ChatbotStatus = 'connecting' | 'online' | 'offline';

export interface ChatbotMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
}

// Chainlit step (subset). Display messages arrive as type 'assistant_message';
// intermediate cl.Step "thinking" containers arrive with other types and are
// ignored, tokens included (their ids never enter the message list).
interface ChainlitStep {
  id: string;
  type?: string;
  output?: string;
}

interface ChainlitToken {
  id: string;
  token: string;
  isSequence?: boolean;
}

/** Configured chatbot base URL, or null when the feature is off (mock panel). */
export function getChatbotUrl(): string | null {
  const url = import.meta.env.VITE_CHATBOT_URL || config.chatbotUrl;
  return url && url.startsWith('http') ? url.replace(/\/$/, '') : null;
}

export function useChatbotSession(enabled: boolean) {
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [status, setStatus] = useState<ChatbotStatus>('connecting');
  const [thinking, setThinking] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const base = enabled ? getChatbotUrl() : null;
    if (!base) return;
    let cancelled = false;
    let socket: Socket | null = null;

    const connect = async () => {
      setStatus('connecting');
      // Chainlit authenticates the websocket via cookie; POST /auth/header
      // exchanges our Bearer token for it (header_auth_callback backend-side).
      // Failure is tolerated: a backend running without auth accepts the socket.
      try {
        await fetch(`${base}/auth/header`, {
          method: 'POST',
          credentials: 'include',
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        });
      } catch {
        // backend without auth, or unreachable — the socket outcome decides
      }
      if (cancelled) return;

      const { protocol, host, pathname } = new URL(base);
      socket = io(`${protocol}//${host}`, {
        path: pathname && pathname !== '/' ? `${pathname}/ws/socket.io` : '/ws/socket.io',
        withCredentials: true,
        auth: {
          clientType: 'webapp',
          sessionId: crypto.randomUUID(),
          threadId: '',
          userEnv: '{}',
          chatProfile: '',
        },
      });
      socketRef.current = socket;

      const upsertBot = (step: ChainlitStep) => {
        if (step.type !== 'assistant_message') return;
        setMessages(prev => {
          const i = prev.findIndex(m => m.id === step.id);
          const text = step.output ?? '';
          if (i === -1) return [...prev, { id: step.id, role: 'bot', text }];
          const next = [...prev];
          next[i] = { ...next[i], text };
          return next;
        });
      };

      socket.on('connect', () => { socket?.emit('connection_successful'); setStatus('online'); });
      socket.on('connect_error', () => setStatus('offline'));
      socket.on('disconnect', () => setStatus('offline'));
      socket.on('task_start', () => setThinking(true));
      socket.on('task_end', () => setThinking(false));
      socket.on('stream_start', upsertBot);
      socket.on('new_message', upsertBot);
      socket.on('update_message', upsertBot);
      socket.on('stream_token', ({ id, token, isSequence }: ChainlitToken) => {
        setMessages(prev => {
          const i = prev.findIndex(m => m.id === id);
          if (i === -1) return prev;
          const next = [...prev];
          next[i] = { ...next[i], text: isSequence ? token : next[i].text + token };
          return next;
        });
      });
    };

    connect();
    return () => {
      cancelled = true;
      socket?.removeAllListeners();
      socket?.close();
      socketRef.current = null;
      setMessages([]);
      setThinking(false);
      setStatus('connecting');
    };
  }, [enabled]);

  const sendMessage = useCallback((text: string) => {
    const id = crypto.randomUUID();
    setMessages(prev => [...prev, { id, role: 'user', text }]);
    // socket.io buffers emits while (re)connecting: sending "offline" is safe.
    socketRef.current?.emit('client_message', {
      message: { id, name: 'user', type: 'user_message', output: text, createdAt: new Date().toISOString() },
      fileReferences: [],
    });
  }, []);

  return { messages, status, thinking, sendMessage };
}
