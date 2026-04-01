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
    .replace(/^(?!<[hlp]|<li|<hr)(.+)/gm, '$1')
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Carrega info do usuário e conversas
  useEffect(() => {
    fetchUserInfo();
    fetchConversations();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.status === 401) { router.push('/login'); return; }
      const data = await res.json();
      setUserInfo(data);
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

  const newChat = () => {
    setCurrentConvId(null);
    setMessages([]);
    setInput('');
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setLoading(true);

    const newMsg: Message = { role: 'user', content: userMsg, id: crypto.randomUUID() };
    setMessages(prev => [...prev, newMsg]);

    // Placeholder para resposta do modelo
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
          ? { ...m, content: '⚠️ Limite de mensagens atingido. Faça upgrade para continuar.' }
          : m));
        setLoading(false);
        return;
      }

      if (!res.ok || !res.body) throw new Error('Erro na resposta');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const json = JSON.parse(line.slice(6));
            if (json.text) {
              fullText += json.text;
              setMessages(prev => prev.map(m => m.id === placeholderId ? { ...m, content: fullText } : m));
            }
            if (json.done) {
              if (json.conversationId && !currentConvId) {
                setCurrentConvId(json.conversationId);
                fetchConversations();
              }
            }
            if (json.error) throw new Error(json.error);
          } catch {}
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === placeholderId
        ? { ...m, content: 'Erro ao obter resposta. Tente novamente.' } : m));
    } finally {
      setLoading(false);
      // Atualiza contagem de mensagens
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

  const msgLimit = userInfo?.messagesLimit || 10;
  const msgUsed = userInfo?.messagesUsed || 0;
  const msgPercent = Math.min((msgUsed / msgLimit) * 100, 100);

  return (
    <div className="h-screen bg-polaris-black flex overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 flex-shrink-0 border-r border-polaris-gold/10 flex flex-col overflow-hidden`}>
        {/* Header sidebar */}
        <div className="p-4 border-b border-polaris-gold/10">
          <div className="flex items-center gap-2 mb-4">
            <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6 flex-shrink-0">
              <polygon points="16,2 20,12 30,12 22,18 25,28 16,22 7,28 10,18 2,12 12,12" fill="none" stroke="#C9A84C" strokeWidth="1.5"/>
              <circle cx="16" cy="16" r="3" fill="#C9A84C"/>
            </svg>
            <span className="font-display text-xs font-bold tracking-[0.2em] text-gold-gradient">POLARIS AI</span>
          </div>
          <button onClick={newChat} className="btn-ghost w-full py-2 px-3 rounded text-xs flex items-center gap-2 justify-center">
            <span>+</span> Nova Consulta
          </button>
        </div>

        {/* Conversas */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-polaris-silver/30 text-xs text-center py-6 font-body">Nenhuma consulta ainda</p>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                className={`sidebar-item ${currentConvId === conv.id ? 'active' : ''}`}
                onClick={() => loadConversation(conv.id)}
              >
                {conv.title}
              </div>
            ))
          )}
        </div>

        {/* User info */}
        <div className="p-4 border-t border-polaris-gold/10">
          {userInfo && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-polaris-silver/60 text-xs font-body truncate">{userInfo.name}</span>
                <span className={`plan-badge plan-${userInfo.plan}`}>{userInfo.plan}</span>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-xs text-polaris-silver/40 mb-1 font-body">
                  <span>Mensagens</span>
                  <span>{msgUsed}/{msgLimit === 999999 ? '∞' : msgLimit}</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${msgPercent}%`,
                      background: msgPercent > 80 ? '#EF4444' : 'linear-gradient(90deg, #9B7A2E, #C9A84C)'
                    }}
                  />
                </div>
              </div>
              {userInfo.role === 'admin' && (
                <a href="/admin" className="block text-center text-xs text-polaris-gold/60 hover:text-polaris-gold mb-2 font-display tracking-wider transition-colors">
                  ↗ Painel Admin
                </a>
              )}
              <button onClick={handleLogout} className="text-polaris-silver/30 hover:text-polaris-silver/60 text-xs w-full text-center transition-colors font-body">
                Sair
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main chat */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <header className="flex items-center gap-4 px-4 py-3 border-b border-polaris-gold/10">
          <button onClick={() => setSidebarOpen(s => !s)} className="text-polaris-silver/40 hover:text-polaris-gold transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1">
            <span className="font-display text-xs tracking-[0.15em] text-polaris-silver/40">
              {currentConvId
                ? conversations.find(c => c.id === currentConvId)?.title || 'Consulta'
                : 'Nova Consulta — POLARIS AI'}
            </span>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
              <svg viewBox="0 0 32 32" fill="none" className="w-16 h-16 mb-6 opacity-30">
                <polygon points="16,2 20,12 30,12 22,18 25,28 16,22 7,28 10,18 2,12 12,12" fill="none" stroke="#C9A84C" strokeWidth="1.5"/>
                <circle cx="16" cy="16" r="3" fill="#C9A84C"/>
              </svg>
              <h2 className="font-display text-xl font-bold text-polaris-gold/60 mb-3 tracking-wider">POLARIS AI</h2>
              <p className="text-polaris-silver/40 text-sm font-body max-w-sm leading-relaxed">
                14 especialistas prontos para sua campanha. Digite <strong className="text-polaris-gold/60">SCAN</strong> para ver todas as capacidades, ou faça sua primeira pergunta.
              </p>
              <div className="flex flex-wrap gap-2 mt-6 justify-center">
                {['SCAN', 'Diagnóstico de cenário', 'Estratégia de primeiro turno', 'Slogan para vereador'].map(s => (
                  <button key={s} onClick={() => setInput(s)}
                    className="text-xs px-3 py-2 rounded border border-polaris-gold/15 text-polaris-silver/50 hover:border-polaris-gold/40 hover:text-polaris-gold transition-all font-body">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`max-w-[80%] px-4 py-3 ${msg.role === 'user' ? 'msg-user' : 'msg-model'}`}>
                {msg.role === 'model' && (
                  <div className="flex items-center gap-2 mb-2">
                    <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3">
                      <polygon points="8,1 10,6 15,6 11,9 12.5,14 8,11 3.5,14 5,9 1,6 6,6" fill="none" stroke="#C9A84C" strokeWidth="1"/>
                    </svg>
                    <span className="font-display text-xs tracking-[0.1em] text-polaris-gold/60">POLARIS AI</span>
                  </div>
                )}
                {msg.content === '' && loading ? (
                  <div className="flex gap-1 items-center py-1">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                ) : (
                  <div
                    className="prose-polaris text-sm font-body leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  />
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-4 border-t border-polaris-gold/10">
          <div className="max-w-4xl mx-auto">
            <div className="gold-border rounded-xl overflow-hidden flex items-end gap-0 bg-white/[0.02]">
              <textarea
                ref={textareaRef}
                className="flex-1 bg-transparent px-4 py-3 text-white text-sm font-body resize-none outline-none placeholder-polaris-silver/30 min-h-[52px] max-h-[160px]"
                placeholder="Descreva sua campanha, candidato ou demanda estratégica..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                style={{ lineHeight: '1.6' }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="btn-gold m-2 px-4 py-2 rounded-lg text-xs disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
              >
                {loading ? '...' : '→'}
              </button>
            </div>
            <p className="text-polaris-silver/25 text-xs text-center mt-2 font-body">
              Enter para enviar · Shift+Enter para nova linha · Todas as respostas validadas pela Memória Legal
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
