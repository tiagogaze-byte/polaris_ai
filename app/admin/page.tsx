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
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'client', plan: 'free', messagesLimit: 50 });
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
    setCreating(true);
    setCreateMsg('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (!res.ok) { setCreateMsg(`❌ ${data.error}`); return; }
      setCreateMsg('✓ Usuário criado com sucesso!');
      setNewUser({ name: '', email: '', password: '', role: 'client', plan: 'free', messagesLimit: 50 });
      loadUsers();
      setTimeout(() => setTab('users'), 1200);
    } catch { setCreateMsg('❌ Erro de conexão'); }
    setCreating(false);
  };

  const updateUser = async (id: string, updates: Record<string, any>) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
  const planClass: Record<string, string> = { trial: 'plan-trial', free: 'plan-free', pro: 'plan-pro', enterprise: 'plan-enterprise' };
  const statusColor: Record<string, string> = { active: 'text-emerald-400', inactive: 'text-gray-500', suspended: 'text-red-400' };

  return (
    <div className="min-h-screen bg-polaris-black text-white">
      <div className="fixed inset-0 star-bg pointer-events-none opacity-20" />

      {/* Header */}
      <header className="relative border-b border-polaris-gold/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
            <polygon points="16,2 20,12 30,12 22,18 25,28 16,22 7,28 10,18 2,12 12,12" fill="none" stroke="#C9A84C" strokeWidth="1.5"/>
            <circle cx="16" cy="16" r="3" fill="#C9A84C"/>
          </svg>
          <div>
            <span className="font-display text-sm font-bold tracking-[0.2em] text-gold-gradient">POLARIS AI</span>
            <span className="font-display text-xs text-polaris-silver/40 ml-3 tracking-widest">ADMIN</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a href="/chat" className="text-polaris-silver/40 hover:text-polaris-gold text-xs font-display tracking-wider transition-colors">→ Chat</a>
          <button onClick={handleLogout} className="text-polaris-silver/30 hover:text-polaris-silver/60 text-xs font-body transition-colors">Sair</button>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Total Usuários', val: stats.total },
              { label: 'Ativos', val: stats.active },
              { label: 'Trials', val: stats.trials },
              { label: 'Clientes', val: stats.clients },
              { label: 'Mensagens Enviadas', val: stats.total_messages || '0' },
            ].map(s => (
              <div key={s.label} className="gold-border rounded-lg p-4 text-center">
                <div className="font-display text-2xl font-black text-gold-gradient">{s.val}</div>
                <div className="text-polaris-silver/50 text-xs font-body mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['users', 'create'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`font-display text-xs tracking-[0.1em] uppercase px-4 py-2 rounded border transition-all ${tab === t ? 'btn-gold' : 'btn-ghost opacity-60'}`}>
              {t === 'users' ? `Usuários (${users.length})` : '+ Novo Usuário'}
            </button>
          ))}
          <div className="flex-1" />
          {tab === 'users' && (
            <input className="polaris-input max-w-xs text-sm" placeholder="Buscar por nome ou email..."
              value={search} onChange={e => setSearch(e.target.value)} />
          )}
        </div>

        {/* Users table */}
        {tab === 'users' && (
          <div className="gold-border rounded-xl overflow-hidden">
            {loading ? (
              <div className="text-center py-12 text-polaris-silver/30 font-body">Carregando...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-polaris-gold/10 bg-polaris-gold/5">
                      {['Nome / Email', 'Role', 'Plano', 'Status', 'Mensagens', 'Último acesso', 'Criado em', 'Ações'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-display text-xs tracking-[0.08em] text-polaris-silver/50 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(user => (
                      <tr key={user.id} className="border-b border-polaris-gold/5 hover:bg-polaris-gold/3 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-body text-sm text-white">{user.name}</div>
                          <div className="font-body text-xs text-polaris-silver/40">{user.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          {editingUser === user.id ? (
                            <select className="polaris-input text-xs py-1 px-2 w-24"
                              value={user.role}
                              onChange={e => updateUser(user.id, { role: e.target.value })}>
                              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          ) : (
                            <span className="text-xs text-polaris-silver/60 font-body">{user.role}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingUser === user.id ? (
                            <select className="polaris-input text-xs py-1 px-2 w-28"
                              value={user.plan}
                              onChange={e => updateUser(user.id, { plan: e.target.value })}>
                              {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                          ) : (
                            <span className={`plan-badge ${planClass[user.plan] || 'plan-trial'}`}>{user.plan}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingUser === user.id ? (
                            <select className="polaris-input text-xs py-1 px-2 w-28"
                              value={user.status}
                              onChange={e => updateUser(user.id, { status: e.target.value })}>
                              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          ) : (
                            <span className={`text-xs font-body ${statusColor[user.status] || 'text-gray-400'}`}>{user.status}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-body text-polaris-silver/60">
                            {user.messages_used}/{user.messages_limit === 999999 ? '∞' : user.messages_limit}
                          </div>
                          <div className="h-1 w-16 bg-white/5 rounded-full mt-1 overflow-hidden">
                            <div className="h-full rounded-full bg-polaris-gold/60"
                              style={{ width: `${Math.min((user.messages_used / user.messages_limit) * 100, 100)}%` }} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-polaris-silver/40 font-body">{formatDate(user.last_login_at)}</td>
                        <td className="px-4 py-3 text-xs text-polaris-silver/40 font-body">{formatDate(user.created_at)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setEditingUser(editingUser === user.id ? null : user.id)}
                            className={`text-xs font-display tracking-wider px-3 py-1 rounded border transition-all ${editingUser === user.id ? 'btn-gold' : 'btn-ghost opacity-60'}`}>
                            {editingUser === user.id ? '✓' : 'Editar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="text-center py-8 text-polaris-silver/30 font-body text-sm">Nenhum usuário encontrado</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Create user form */}
        {tab === 'create' && (
          <div className="max-w-lg">
            <div className="gold-border rounded-xl p-8 bg-gradient-to-b from-white/[0.02] to-transparent">
              <h2 className="font-display text-sm font-bold tracking-[0.15em] text-polaris-gold mb-6 uppercase">Criar Novo Usuário</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                {[
                  { label: 'Nome', key: 'name', type: 'text', placeholder: 'Nome completo' },
                  { label: 'Email', key: 'email', type: 'email', placeholder: 'email@exemplo.com' },
                  { label: 'Senha', key: 'password', type: 'password', placeholder: 'Mínimo 8 caracteres' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="font-display text-xs tracking-[0.1em] text-polaris-silver/60 uppercase block mb-2">{f.label}</label>
                    <input type={f.type} className="polaris-input" placeholder={f.placeholder}
                      value={(newUser as any)[f.key]}
                      onChange={e => setNewUser(u => ({ ...u, [f.key]: e.target.value }))} required />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-display text-xs tracking-[0.1em] text-polaris-silver/60 uppercase block mb-2">Role</label>
                    <select className="polaris-input" value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}>
                      {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-display text-xs tracking-[0.1em] text-polaris-silver/60 uppercase block mb-2">Plano</label>
                    <select className="polaris-input" value={newUser.plan} onChange={e => setNewUser(u => ({ ...u, plan: e.target.value }))}>
                      {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="font-display text-xs tracking-[0.1em] text-polaris-silver/60 uppercase block mb-2">Limite de Mensagens</label>
                  <input type="number" className="polaris-input" value={newUser.messagesLimit}
                    onChange={e => setNewUser(u => ({ ...u, messagesLimit: Number(e.target.value) }))} min={1} />
                </div>

                {createMsg && (
                  <div className={`text-sm font-body p-3 rounded border ${createMsg.startsWith('✓') ? 'text-emerald-400 border-emerald-500/30 bg-emerald-900/20' : 'text-red-400 border-red-500/30 bg-red-900/20'}`}>
                    {createMsg}
                  </div>
                )}

                <button type="submit" disabled={creating} className="btn-gold w-full py-3 rounded text-xs disabled:opacity-50">
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
