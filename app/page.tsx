'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const SQUADS = [
  {
    name: 'Estratégia Política',
    icon: '⚔',
    color: 'from-blue-900/40 to-blue-800/20',
    experts: ['Alan Oliveira', 'Duda Lima', 'Chris LaCivita', 'Sidônio Palmeira', 'Susie Wiles', 'Marcelo Vitorino', 'Emanoelton Borges'],
    desc: 'O cérebro da operação — mobilização, narrativa e domínio eleitoral.'
  },
  {
    name: 'Publicidade e Propaganda',
    icon: '✦',
    color: 'from-amber-900/40 to-amber-800/20',
    experts: ['Nizan Guanaes', 'Washington Olivetto', 'Duda Mendonça'],
    desc: 'Transformando política em cultura de massa e impacto emocional.'
  },
  {
    name: 'Rebranding Político',
    icon: '◈',
    color: 'from-emerald-900/30 to-emerald-800/10',
    experts: ['Danny Diaz', 'Rodrigo Bueno', 'César Rocha', 'Natália Mendonça'],
    desc: 'Reconstrução de reputações e modernização de imagem.'
  },
];

const FEATURES = [
  { icon: '⚖', title: 'Memória Legal Blindada', desc: '14 Resoluções TSE 2026 + Lei das Eleições + Código Eleitoral. Toda sugestão validada juridicamente.' },
  { icon: '◆', title: 'Inteligência Coletiva', desc: '14 clones cognitivos dos maiores especialistas do Brasil e do mundo trabalhando simultaneamente.' },
  { icon: '▲', title: 'Entregáveis Concretos', desc: 'Slogans, discursos, peças, posts, roteiros e estratégias prontas. Zero resposta vaga.' },
  { icon: '✦', title: 'Níveis DIAMANTE e OURO', desc: 'Estratégia 360° com KPIs, cronograma e análise de risco ou táticas avançadas prontas para uso.' },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSquad, setActiveSquad] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setActiveSquad(s => (s + 1) % SQUADS.length), 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-polaris-black overflow-x-hidden">
      {/* Star background */}
      <div className="fixed inset-0 star-bg pointer-events-none opacity-60" />
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(201,168,76,0.08) 0%, transparent 60%)' }} />

      {/* Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-polaris-black/90 backdrop-blur-md border-b border-polaris-gold/10' : ''}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative">
              <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
                <polygon points="16,2 20,12 30,12 22,18 25,28 16,22 7,28 10,18 2,12 12,12" fill="none" stroke="#C9A84C" strokeWidth="1.5"/>
                <circle cx="16" cy="16" r="3" fill="#C9A84C"/>
              </svg>
            </div>
            <span className="font-display text-sm font-bold tracking-[0.2em] text-gold-gradient">POLARIS AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="btn-ghost px-5 py-2 rounded text-xs">Entrar</Link>
            <Link href="/register" className="btn-gold px-5 py-2 rounded text-xs">Testar Grátis</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-polaris-gold/20 bg-polaris-gold/5 mb-8 animate-fade-in">
            <span className="text-polaris-gold text-xs">★</span>
            <span className="font-display text-xs tracking-[0.15em] text-polaris-gold/80 uppercase">Super Agente de Elite — Versão 5.0</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-black leading-none tracking-tight mb-6 animate-slide-up">
            <span className="text-white">INTELIGÊNCIA</span>
            <br />
            <span className="text-gold-gradient">POLÍTICA</span>
            <br />
            <span className="text-white text-4xl md:text-5xl font-normal tracking-widest">DE ELITE</span>
          </h1>

          <p className="font-body text-lg md:text-xl text-polaris-silver/70 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in" style={{animationDelay:'0.2s'}}>
            14 clones cognitivos dos maiores especialistas em estratégia política, rebranding e publicidade eleitoral do Brasil e do mundo — trabalhando para sua campanha.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{animationDelay:'0.3s'}}>
            <Link href="/register" className="btn-gold px-8 py-4 rounded text-sm inline-block">
              Começar Teste Gratuito — 7 dias
            </Link>
            <Link href="/login" className="btn-ghost px-8 py-4 rounded text-sm inline-block">
              Já tenho conta
            </Link>
          </div>

          <p className="text-polaris-silver/40 text-xs mt-4 font-body">10 consultas gratuitas · Sem cartão de crédito</p>
        </div>
      </section>

      {/* Squads */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-bold text-gold-gradient mb-3">Squads de Inteligência</h2>
            <p className="text-polaris-silver/60 font-body">Três frentes especializadas. Uma síntese de elite.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {SQUADS.map((squad, i) => (
              <div
                key={squad.name}
                className={`gold-border rounded-lg p-6 cursor-pointer transition-all duration-500 bg-gradient-to-b ${squad.color} ${activeSquad === i ? 'scale-105' : 'opacity-70'}`}
                onClick={() => setActiveSquad(i)}
              >
                <div className="text-3xl mb-3 text-polaris-gold">{squad.icon}</div>
                <h3 className="font-display text-sm font-bold tracking-[0.1em] text-polaris-gold-light mb-2 uppercase">{squad.name}</h3>
                <p className="text-polaris-silver/60 text-sm font-body mb-4">{squad.desc}</p>
                <div className="space-y-1">
                  {squad.experts.map(e => (
                    <div key={e} className="text-xs text-polaris-silver/40 flex items-center gap-2">
                      <span className="text-polaris-gold-dark">◆</span> {e}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-polaris-gold/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-bold text-white mb-3">Por que POLARIS AI?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="gold-border rounded-lg p-6 hover:scale-[1.02] transition-transform">
                <div className="text-2xl text-polaris-gold mb-3">{f.icon}</div>
                <h3 className="font-display text-sm font-bold tracking-[0.08em] text-polaris-gold-light mb-2 uppercase">{f.title}</h3>
                <p className="text-polaris-silver/60 text-sm font-body leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="py-20 px-6 border-t border-polaris-gold/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold text-gold-gradient mb-3">Planos</h2>
          <p className="text-polaris-silver/60 font-body mb-12">Comece de graça. Escale quando precisar.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Trial', price: 'Grátis', period: '7 dias', msgs: '10 consultas', cta: 'Começar', href: '/register', highlight: false },
              { name: 'Pro', price: 'R$ 297', period: '/mês', msgs: '500 consultas', cta: 'Assinar', href: '/register', highlight: true },
              { name: 'Enterprise', price: 'Sob consulta', period: '', msgs: 'Ilimitado', cta: 'Falar com time', href: '/register', highlight: false },
            ].map(plan => (
              <div key={plan.name} className={`rounded-lg p-6 ${plan.highlight ? 'border border-polaris-gold/60 bg-gradient-to-b from-polaris-gold/10 to-transparent scale-105' : 'gold-border'}`}>
                <div className={`plan-badge mb-4 inline-block ${plan.highlight ? 'plan-pro' : 'plan-trial'}`}>{plan.name}</div>
                <div className="font-display text-3xl font-black text-white mb-1">{plan.price}</div>
                <div className="text-polaris-silver/50 text-xs mb-4 font-body">{plan.period}</div>
                <div className="text-polaris-gold text-sm mb-6 font-body">{plan.msgs}</div>
                <Link href={plan.href} className={`block text-center py-3 rounded text-xs ${plan.highlight ? 'btn-gold' : 'btn-ghost'}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-polaris-gold/10 py-10 px-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
            <polygon points="16,2 20,12 30,12 22,18 25,28 16,22 7,28 10,18 2,12 12,12" fill="none" stroke="#C9A84C" strokeWidth="1.5"/>
            <circle cx="16" cy="16" r="3" fill="#C9A84C"/>
          </svg>
          <span className="font-display text-xs tracking-[0.2em] text-polaris-gold/60">POLARIS AI</span>
        </div>
        <p className="text-polaris-silver/30 text-xs font-body">
          Todas as estratégias validadas conforme a legislação eleitoral vigente. Uso ético e responsável da IA na política.
        </p>
      </footer>
    </div>
  );
}
