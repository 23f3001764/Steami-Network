import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, MessageCircle, Search, Send } from 'lucide-react';
import { SteamiLayout } from '@/components/SteamiLayout';
import { RequireLogin } from '@/components/RequireLogin';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

type ChatUser = {
  id: string;
  uid?: string;
  username?: string;
  display_name?: string;
  full_name?: string;
  email?: string;
  avatar?: string;
  last_message?: string | { text?: string; created_at?: string; timestamp?: number };
  unread_count?: number;
};
type ChatMessage = { id?: string; senderId: string; receiverId: string; text: string; timestamp?: number; created_at?: string; status?: string };

const getName = (user: ChatUser) => user.username || user.display_name || user.full_name || user.email || 'STEAMI User';

export default function ChatPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selected, setSelected] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const myId = user?.id || '';

  const visibleUsers = useMemo(() => users.filter((u) => (u.id || u.uid) !== myId), [myId, users]);

  const loadUsers = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    setLoading(true);
    setError('');
    try {
      await api.chat.upsertUser({ id: user.id, username: user.fullName, email: user.email, avatar: '' });
      const data: any = await api.chat.discoverUsers({ uid: user.id, q: query });
      setUsers(Array.isArray(data) ? data : data?.users ?? []);
    } catch (err: any) {
      try {
        const data: any = await api.chat.users();
        setUsers(Array.isArray(data) ? data : data?.users ?? []);
      } catch {
        setError(err.message || 'Could not load chat users');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, query, user]);

  const loadMessages = useCallback(async () => {
    if (!selected || !myId) return;
    try {
      const data: any = await api.chat.messages({ senderId: myId, receiverId: selected.id });
      setMessages(Array.isArray(data) ? data : data?.messages ?? []);
      await api.chat.markSeen({ receiverId: myId, senderId: selected.id }).catch(() => undefined);
    } catch (err: any) {
      setError(err.message || 'Could not load messages');
    }
  }, [myId, selected]);

  useEffect(() => {
    const timer = setTimeout(loadUsers, query ? 250 : 0);
    return () => clearTimeout(timer);
  }, [loadUsers, query]);

  useEffect(() => {
    loadMessages();
    if (!selected) return;
    const timer = setInterval(loadMessages, 4000);
    return () => clearInterval(timer);
  }, [loadMessages, selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !selected || !myId) return;
    const draft = text.trim();
    setText('');
    setSending(true);
    try {
      const msg = await api.chat.sendMessage({ senderId: myId, receiverId: selected.id, text: draft });
      setMessages((prev) => [...prev, msg as ChatMessage]);
    } catch (err: any) {
      setText(draft);
      setError(err.message || 'Message failed');
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <SteamiLayout>
        <RequireLogin message="Please login first to chat with other STEAMI users." />
      </SteamiLayout>
    );
  }

  return (
    <SteamiLayout>
      <div className="mb-8">
        <h1 className="steami-heading text-3xl md:text-4xl mb-3">Messages</h1>
        <p className="text-[15px] text-muted-foreground">Search users, send messages, and keep conversations synced through the backend chat API.</p>
      </div>

      <div className="glass-card overflow-hidden h-[640px] grid grid-cols-1 md:grid-cols-[320px_1fr]">
        <aside className="border-r border-white/10 flex flex-col min-h-0">
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users" className="w-full rounded-lg border border-white/10 bg-white/[0.04] pl-9 pr-3 py-2 text-[14px] outline-none focus:border-steami-cyan/40" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="h-32 flex items-center justify-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /></div>
            ) : visibleUsers.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center gap-2 text-muted-foreground text-[13px]"><MessageCircle className="w-5 h-5" />No users found</div>
            ) : (
              visibleUsers.map((u) => {
                const userId = u.id || u.uid || '';
                const lastMessage = typeof u.last_message === 'string' ? u.last_message : u.last_message?.text;
                return (
                <button key={userId} onClick={() => setSelected({ ...u, id: userId })} className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${selected?.id === userId ? 'bg-steami-cyan/10 text-steami-cyan' : 'hover:bg-white/[0.04]'}`}>
                  <div className="w-9 h-9 rounded-lg bg-steami-cyan/15 flex items-center justify-center font-mono text-[11px]">{getName(u).slice(0, 2).toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-[16px] font-bold truncate">{getName(u)}</p>
                    <p className="font-mono text-[11px] text-muted-foreground truncate">{lastMessage || u.email}</p>
                  </div>
                  {!!u.unread_count && <span className="min-w-5 rounded-full bg-steami-gold px-1.5 py-0.5 text-center font-mono text-[10px] font-bold text-slate-950">{u.unread_count}</span>}
                </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex flex-col min-h-0">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <MessageCircle className="w-10 h-10 opacity-50" />
              <p className="text-[14px]">Select a conversation</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-white/10">
                <p className="font-serif text-[18px] font-bold">{getName(selected)}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{selected.email}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((msg, index) => {
                  const mine = msg.senderId === myId;
                  const time = msg.created_at ? new Date(msg.created_at) : msg.timestamp ? new Date(msg.timestamp) : null;
                  return (
                    <div key={msg.id ?? index} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${mine ? 'bg-steami-cyan text-slate-950 rounded-br-sm' : 'bg-white/[0.08] rounded-bl-sm'}`}>
                        <p className="text-[14px] leading-relaxed break-words">{msg.text}</p>
                        <p className={`mt-1 text-[10px] opacity-55 ${mine ? 'text-right' : ''}`}>{time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}{mine && msg.status === 'seen' ? ' · seen' : ''}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              {error && <p className="px-4 pb-2 text-[12px] text-steami-red">{error}</p>}
              <div className="p-4 border-t border-white/10 flex gap-2">
                <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder={`Message ${getName(selected)}`} className="flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-[14px] outline-none focus:border-steami-cyan/40" />
                <button onClick={send} disabled={!text.trim() || sending} className="w-10 h-10 rounded-xl bg-steami-cyan text-slate-950 flex items-center justify-center disabled:opacity-40">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </SteamiLayout>
  );
}
