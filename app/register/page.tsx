'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('As senhas não coincidem'); return; }
    if (form.password.length < 8) { setError('Senha deve ter no mínimo 8 caracteres'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erro ao criar conta'); return; }
      router.push('/chat');
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-polaris-black flex items-center justify-center px-4 py-10">
      <div className="fixed inset-0 star-bg pointer-events-none opacity-40" />
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(201,168,76,0.04) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <svg viewBox="0 0 32 32" fill="none" className="w-10 h-10">
              <polygon points="16,2 20,12 30,12 22,18 25,28 16,22 7,28 10,18 2,12 12,12" fill="none" stroke="#C9A84C" strokeWidth="1.5"/>
              <circle cx="16" cy="16" r="3" fill="#C9A84C"/>
            </svg>
            <span className="font-display text-base font-bold tracking-[0.25em] text-gold-gradient">POLARIS AI</span>
          </Link>
          <p className="text-polaris-silver/50 text-sm font-body mt-3">7 dias grátis. Sem cartão de crédito.</p>
        </div>

        <div className="gold-border rounded-xl p-8 bg-gradient-to-b from-white/[0.02] to-transparent backdrop-blur-sm">
          {/* Trial info */}
          <div className="bg-polaris-gold/5 border border-polaris-gold/20 rounded-lg p-4 mb-6">
            <div className="font-display text-xs tracking-[0.1em] text-polaris-gold uppercase mb-1">Trial Gratuito</div>
            <div className="text-polaris-silver/60 text-sm font-body">
              7 dias de acesso · 10 consultas ao POLARIS AI · Todos os Squads ativos
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-display text-xs tracking-[0.1em] text-polaris-silver/60 uppercase block mb-2">Nome completo</label>
              <input type="text" className="polaris-input" placeholder="Seu nome"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="font-display text-xs tracking-[0.1em] text-polaris-silver/60 uppercase block mb-2">Email</label>
              <input type="email" className="polaris-input" placeholder="seu@email.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label className="font-display text-xs tracking-[0.1em] text-polaris-silver/60 uppercase block mb-2">Senha</label>
              <input type="password" className="polaris-input" placeholder="Mínimo 8 caracteres"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <div>
              <label className="font-display text-xs tracking-[0.1em] text-polaris-silver/60 uppercase block mb-2">Confirmar senha</label>
              <input type="password" className="polaris-input" placeholder="Repita a senha"
                value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} required />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded p-3 text-red-400 text-sm font-body">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="btn-gold w-full py-4 rounded text-sm disabled:opacity-50 mt-2">
              {loading ? 'Criando conta...' : 'Criar conta e começar →'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-polaris-gold/10 text-center">
            <p className="text-polaris-silver/50 text-sm font-body">
              Já tem conta?{' '}
              <Link href="/login" className="text-polaris-gold hover:text-polaris-gold-light transition-colors">Entrar</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
