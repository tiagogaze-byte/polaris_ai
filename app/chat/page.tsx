'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Message { role: 'user' | 'model'; content: string; id: string; }
interface Conversation { id: string; title: string; updated_at: string; }
interface UserInfo { name: string; role: string; plan: string; messagesUsed: number; messagesLimit: number; }

function renderMarkdown(text: string): string {
  return text
    .replace(/### (.+)/g, '<h3>$1</h3>')
    .replace(/## (.+)/g, '<h2>$1</h2>')
    .replace(/# (.+)/g, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/^\* (.+)/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .trim();
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => { fetchUserInfo(); fetchConversations(); }, []);

  const fetchUserInfo = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.status === 401) { router.push('/login'); return; }
      setUserInfo(await res.json());
    } catch { router.push('/login'); }
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch {}
  };

  const loadConversation = async (convId: string) => {
    try {
      const res = await fetch(`/api/conversations?id=${convId}`);
      if (!res.ok) return;
      const data = await res.json();
      setCurrentConvId(convId);
      setMessages(data.messages.map((m: any) => ({ ...m, id: m.id })));
    } catch {}
  };

  const newChat = () => { setCurrentConvId(null); setMessages([]); setInput(''); };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setLoading(true);

    const newMsg: Message = { role: 'user', content: userMsg, id: crypto.randomUUID() };
    setMessages(prev => [...prev, newMsg]);
    const placeholderId = crypto.randomUUID();
    setMessages(prev => [...prev, { role: 'model', content: '', id: placeholderId }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, conversationId: currentConvId }),
      });

      if (res.status === 429) {
        setMessages(prev => prev.map(m => m.id === placeholderId
          ? { ...m, content: '⚠️ Limite de mensagens atingido. Faça upgrade para continuar.' } : m));
        setLoading(false); return;
      }
      if (!res.ok || !res.body) throw new Error('Erro');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          try {
            const json = JSON.parse(line.slice(6));
            if (json.text) {
              fullText += json.text;
              setMessages(prev => prev.map(m => m.id === placeholderId ? { ...m, content: fullText } : m));
            }
            if (json.done && json.conversationId && !currentConvId) {
              setCurrentConvId(json.conversationId);
              fetchConversations();
            }
          } catch {}
        }
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === placeholderId
        ? { ...m, content: 'Erro ao obter resposta. Tente novamente.' } : m));
    } finally {
      setLoading(false);
      if (userInfo) setUserInfo(u => u ? { ...u, messagesUsed: u.messagesUsed + 1 } : u);
    }
  }, [input, loading, currentConvId, userInfo]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const exportPDF = () => {
    if (!currentConvId) return;
    window.open(`/api/export/pdf?id=${currentConvId}`, '_blank');
  };

  const msgLimit = userInfo?.messagesLimit || 10;
  const msgUsed = userInfo?.messagesUsed || 0;
  const msgPercent = Math.min((msgUsed / msgLimit) * 100, 100);
  const currentTitle = conversations.find(c => c.id === currentConvId)?.title;

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 flex-shrink-0 flex flex-col overflow-hidden`}
        style={{ borderRight: '1.5px solid var(--border)', background: 'var(--bg-secondary)' }}>

        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 flex-shrink-0">
              <polygon points="16,2 20,12 30,12 22,18 25,28 16,22 7,28 10,18 2,12 12,12" fill="none" stroke="#8B6914" strokeWidth="1.5"/>
              <circle cx="16" cy="16" r="3" fill="#8B6914"/>
            </svg>
            <span className="font-display text-sm font-bold tracking-[0.18em] text-gold-gradient">POLARIS AI</span>
          </div>
          <button onClick={newChat}
            className="btn-ghost w-full py-2.5 px-3 rounded-lg text-sm flex items-center gap-2 justify-center">
            <span className="text-lg leading-none">+</span> Nova Consulta
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-center py-8 text-sm font-body" style={{ color: 'var(--text-subtle)' }}>
              Nenhuma consulta ainda
            </p>
          ) : conversations.map(conv => (
            <div key={conv.id}
              className={`sidebar-item ${currentConvId === conv.id ? 'active' : ''}`}
              onClick={() => loadConversation(conv.id)}>
              {conv.title}
            </div>
          ))}
        </div>

        <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
          {userInfo && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-body font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {userInfo.name}
                </span>
                <span className={`plan-badge plan-${userInfo.plan}`}>{userInfo.plan}</span>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1 font-body" style={{ color: 'var(--text-muted)' }}>
                  <span>Mensagens usadas</span>
                  <span>{msgUsed}/{msgLimit === 999999 ? '∞' : msgLimit}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${msgPercent}%`, background: msgPercent > 80 ? '#C53030' : 'var(--gold)' }} />
                </div>
              </div>
              <a href="/analytics"
                className="block text-center text-xs font-display tracking-wider mb-2 transition-colors"
                style={{ color: 'var(--gold)' }}>
                ◆ Meu Analytics
              </a>
              {userInfo.role === 'admin' && (
                <a href="/admin"
                  className="block text-center text-xs font-display tracking-wider mb-2 transition-colors"
                  style={{ color: 'var(--gold)' }}>
                  ↗ Painel Admin
                </a>
              )}
              <button onClick={handleLogout}
                className="text-xs w-full text-center transition-colors font-body"
                style={{ color: 'var(--text-muted)' }}>
                Sair
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="flex items-center gap-4 px-5 py-3"
          style={{ borderBottom: '1.5px solid var(--border)', background: 'var(--bg)' }}>
          <button onClick={() => setSidebarOpen(s => !s)}
            className="transition-colors p-1 rounded"
            style={{ color: 'var(--text-muted)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1">
            <span className="font-display text-sm tracking-[0.1em]" style={{ color: 'var(--text-secondary)' }}>
              {currentTitle || 'Nova Consulta — POLARIS AI'}
            </span>
          </div>
          {currentConvId && (
            <button onClick={exportPDF}
              className="btn-ghost px-4 py-2 rounded-lg text-xs flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Exportar PDF
            </button>
          )}
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6" style={{ background: 'var(--bg)' }}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
              <svg viewBox="0 0 48 48" fill="none" className="w-16 h-16 mb-5" style={{ opacity: 0.5 }}>
                <polygon points="24,3 30,18 45,18 33,27 37.5,42 24,33 10.5,42 15,27 3,18 18,18"
                  fill="none" stroke="#8B6914" strokeWidth="2"/>
                <circle cx="24" cy="24" r="4" fill="#8B6914"/>
              </svg>
              <h2 className="font-display text-2xl font-bold mb-3" style={{ color: 'var(--gold-dark)', letterSpacing: '0.1em' }}>
                POLARIS AI
              </h2>
              <p className="text-base font-body max-w-md leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
                14 especialistas prontos para sua campanha. Digite{' '}
                <strong style={{ color: 'var(--gold-dark)' }}>SCAN</strong>{' '}
                para ver todas as capacidades, ou faça sua primeira pergunta.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['SCAN', 'Diagnóstico de cenário', 'Estratégia de primeiro turno', 'Slogan para vereador'].map(s => (
                  <button key={s} onClick={() => setInput(s)}
                    className="text-sm px-4 py-2 rounded-lg transition-all font-body"
                    style={{ border: '1.5px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`max-w-[82%] px-5 py-4 ${msg.role === 'user' ? 'msg-user' : 'msg-model'}`}>
                {msg.role === 'model' && (
                  <div className="flex items-center gap-2 mb-3" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                      <polygon points="10,1 12.5,7.5 19,7.5 14,11.5 16,18 10,14 4,18 6,11.5 1,7.5 7.5,7.5"
                        fill="none" stroke="#8B6914" strokeWidth="1.2"/>
                    </svg>
                    <span className="font-display text-xs font-bold tracking-[0.12em]" style={{ color: 'var(--gold-dark)' }}>
                      POLARIS AI
                    </span>
                  </div>
                )}
                {msg.content === '' && loading ? (
                  <div className="flex gap-1.5 items-center py-1">
                    <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                  </div>
                ) : (
                  <div className="prose-polaris"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4" style={{ borderTop: '1.5px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-3 rounded-xl p-2"
              style={{ border: '1.5px solid var(--border)', background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <textarea
                className="flex-1 bg-transparent px-3 py-2 text-base font-body resize-none outline-none min-h-[44px] max-h-[160px]"
                style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}
                placeholder="Descreva sua campanha, candidato ou demanda estratégica..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button onClick={sendMessage} disabled={loading || !input.trim()}
                className="btn-gold px-5 py-2.5 rounded-lg text-sm flex-shrink-0">
                {loading ? '...' : 'Enviar →'}
              </button>
            </div>
            <p className="text-xs text-center mt-2 font-body" style={{ color: 'var(--text-subtle)' }}>
              Enter para enviar · Shift+Enter para nova linha · Todas as respostas validadas pela Memória Legal
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
