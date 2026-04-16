'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string; name: string; email: string; role: string; status: string;
  plan: string; messages_used: number; messages_limit: number;
  created_at: string; last_login_at: string | null; trial_ends_at: string;
}
interface Stats { total: string; trials: string; clients: string; active: string; total_messages: string; }

const PLAN_OPTIONS = ['trial', 'free', 'pro', 'enterprise'];
const ROLE_OPTIONS = ['trial', 'client', 'manager', 'admin'];
const STATUS_OPTIONS = ['active', 'inactive', 'suspended'];

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'users' | 'create'>('users');
  const [search, setSearch] = useState('');
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'client', plan: 'pro', messagesLimit: 500 });
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.status === 401 || res.status === 403) { router.push('/chat'); return; }
      const data = await res.json();
      setUsers(data.users || []);
      setStats(data.stats);
    } catch {}
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true); setCreateMsg('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (!res.ok) { setCreateMsg(`❌ ${data.error}`); return; }
      setCreateMsg('✓ Usuário criado com sucesso!');
      setNewUser({ name: '', email: '', password: '', role: 'client', plan: 'pro', messagesLimit: 500 });
      loadUsers();
      setTimeout(() => setTab('users'), 1200);
    } catch { setCreateMsg('❌ Erro de conexão'); }
    setCreating(false);
  };

  const updateUser = async (id: string, updates: Record<string, any>) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    } catch {}
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  const statusStyle = (s: string) => ({
    active:    { color: '#276749', fontWeight: '600' },
    inactive:  { color: '#718096' },
    suspended: { color: '#C53030', fontWeight: '600' },
  }[s] || { color: '#718096' });

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1.5px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
            <polygon points="16,2 20,12 30,12 22,18 25,28 16,22 7,28 10,18 2,12 12,12" fill="none" stroke="#8B6914" strokeWidth="1.5"/>
            <circle cx="16" cy="16" r="3" fill="#8B6914"/>
          </svg>
          <div>
            <span className="font-display text-sm font-bold tracking-[0.18em] text-gold-gradient">POLARIS AI</span>
            <span className="font-display text-xs ml-3 tracking-widest" style={{ color: 'var(--text-muted)' }}>ADMIN</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a href="/chat" className="text-sm font-body transition-colors" style={{ color: 'var(--gold)' }}>→ Chat</a>
          <button onClick={handleLogout} className="text-sm font-body" style={{ color: 'var(--text-muted)' }}>Sair</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Total Usuários', val: stats.total },
              { label: 'Ativos', val: stats.active },
              { label: 'Trials', val: stats.trials },
              { label: 'Clientes', val: stats.clients },
              { label: 'Msgs Enviadas', val: stats.total_messages || '0' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-5 text-center gold-border" style={{ background: 'var(--bg-secondary)' }}>
                <div className="font-display text-3xl font-black mb-1" style={{ color: 'var(--gold-dark)' }}>{s.val}</div>
                <div className="text-xs font-body" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <button onClick={() => setTab('users')}
            className={`px-5 py-2.5 rounded-lg text-sm font-display tracking-wider transition-all ${tab === 'users' ? 'btn-gold' : 'btn-ghost'}`}>
            Usuários ({users.length})
          </button>
          <button onClick={() => setTab('create')}
            className={`px-5 py-2.5 rounded-lg text-sm font-display tracking-wider transition-all ${tab === 'create' ? 'btn-gold' : 'btn-ghost'}`}>
            + Novo Usuário
          </button>
          {tab === 'users' && (
            <input
              className="polaris-input ml-auto"
              style={{ maxWidth: '280px' }}
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          )}
        </div>

        {/* Tabela */}
        {tab === 'users' && (
          <div className="rounded-xl overflow-hidden gold-border">
            {loading ? (
              <div className="text-center py-12 font-body" style={{ color: 'var(--text-muted)' }}>Carregando...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)' }}>
                      {['Nome / Email', 'Role', 'Plano', 'Status', 'Mensagens', 'Último acesso', 'Criado em', 'Ações'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-display text-xs tracking-wider uppercase"
                          style={{ color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((user, i) => (
                      <tr key={user.id}
                        style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-secondary)' }}>
                        <td className="px-4 py-3">
                          <div className="font-body text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{user.name}</div>
                          <div className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>{user.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          {editingUser === user.id ? (
                            <select className="polaris-input text-sm py-1 px-2" style={{ width: '110px' }}
                              value={user.role} onChange={e => updateUser(user.id, { role: e.target.value })}>
                              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          ) : (
                            <span className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>{user.role}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingUser === user.id ? (
                            <select className="polaris-input text-sm py-1 px-2" style={{ width: '120px' }}
                              value={user.plan} onChange={e => updateUser(user.id, { plan: e.target.value })}>
                              {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                          ) : (
                            <span className={`plan-badge plan-${user.plan}`}>{user.plan}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingUser === user.id ? (
                            <select className="polaris-input text-sm py-1 px-2" style={{ width: '120px' }}
                              value={user.status} onChange={e => updateUser(user.id, { status: e.target.value })}>
                              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          ) : (
                            <span className="text-sm font-body" style={statusStyle(user.status)}>{user.status}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                            {user.messages_used}/{user.messages_limit === 999999 ? '∞' : user.messages_limit}
                          </div>
                          <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ width: '64px', background: 'var(--border)' }}>
                            <div className="h-full rounded-full" style={{
                              width: `${Math.min((user.messages_used / user.messages_limit) * 100, 100)}%`,
                              background: 'var(--gold)'
                            }} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-body" style={{ color: 'var(--text-muted)' }}>
                          {formatDate(user.last_login_at)}
                        </td>
                        <td className="px-4 py-3 text-sm font-body" style={{ color: 'var(--text-muted)' }}>
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setEditingUser(editingUser === user.id ? null : user.id)}
                            className={`px-3 py-1.5 rounded text-xs font-display tracking-wider transition-all ${editingUser === user.id ? 'btn-gold' : 'btn-ghost'}`}>
                            {editingUser === user.id ? '✓ Salvar' : 'Editar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="text-center py-10 font-body" style={{ color: 'var(--text-muted)' }}>
                    Nenhum usuário encontrado
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Criar usuário */}
        {tab === 'create' && (
          <div className="max-w-lg">
            <div className="rounded-xl p-8 gold-border" style={{ background: 'var(--bg-secondary)' }}>
              <h2 className="font-display text-base font-bold tracking-wider mb-6" style={{ color: 'var(--gold-dark)' }}>
                CRIAR NOVO USUÁRIO
              </h2>
              <form onSubmit={handleCreate} className="space-y-4">
                {[
                  { label: 'Nome completo', key: 'name', type: 'text', placeholder: 'Nome' },
                  { label: 'Email', key: 'email', type: 'email', placeholder: 'email@exemplo.com' },
                  { label: 'Senha', key: 'password', type: 'password', placeholder: 'Mínimo 8 caracteres' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="font-display text-xs tracking-wider uppercase block mb-2"
                      style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                    <input type={f.type} className="polaris-input" placeholder={f.placeholder}
                      value={(newUser as any)[f.key]}
                      onChange={e => setNewUser(u => ({ ...u, [f.key]: e.target.value }))} required />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-display text-xs tracking-wider uppercase block mb-2"
                      style={{ color: 'var(--text-muted)' }}>Role</label>
                    <select className="polaris-input" value={newUser.role}
                      onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}>
                      {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-display text-xs tracking-wider uppercase block mb-2"
                      style={{ color: 'var(--text-muted)' }}>Plano</label>
                    <select className="polaris-input" value={newUser.plan}
                      onChange={e => setNewUser(u => ({ ...u, plan: e.target.value }))}>
                      {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="font-display text-xs tracking-wider uppercase block mb-2"
                    style={{ color: 'var(--text-muted)' }}>Limite de Mensagens</label>
                  <input type="number" className="polaris-input" value={newUser.messagesLimit} min={1}
                    onChange={e => setNewUser(u => ({ ...u, messagesLimit: Number(e.target.value) }))} />
                </div>
                {createMsg && (
                  <div className={`text-sm font-body p-3 rounded-lg border ${createMsg.startsWith('✓')
                    ? 'text-green-800 border-green-300 bg-green-50'
                    : 'text-red-800 border-red-300 bg-red-50'}`}>
                    {createMsg}
                  </div>
                )}
                <button type="submit" disabled={creating} className="btn-gold w-full py-3 rounded-lg text-sm">
                  {creating ? 'Criando...' : 'Criar Usuário →'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
