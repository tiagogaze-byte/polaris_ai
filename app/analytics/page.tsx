'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AnalyticsData {
  totals: { totalMsgs: number; totalConvs: number; msgsThisWeek: number; msgsToday: number; };
  msgsByDay: { day: string; count: number }[];
  topTopics: { topic: string; count: number }[];
  peakHours: { hour: number; count: number }[];
  topSquads: { squad: string; count: number }[];
}

const SQUAD_COLORS: Record<string, string> = {
  'Estratégia Política': '#3B82F6',
  'Publicidade e Propaganda': '#C9A84C',
  'Rebranding Político': '#10B981',
  'Geral': '#94A3B8',
};

const TOPIC_COLORS = [
  '#C9A84C', '#E8C96A', '#9B7A2E', '#3B82F6',
  '#1E3A8A', '#10B981', '#F59E0B', '#8B5CF6',
];

function BarChart({ data, maxVal, color = '#C9A84C', labelKey, valueKey }:
  { data: any[]; maxVal: number; color?: string; labelKey: string; valueKey: string }) {
  if (!data.length) return <p className="text-polaris-silver/30 text-sm font-body text-center py-8">Sem dados ainda</p>;
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="text-xs text-polaris-silver/50 font-body w-36 text-right truncate flex-shrink-0">
            {item[labelKey]}
          </div>
          <div className="flex-1 h-5 bg-white/5 rounded overflow-hidden">
            <div
              className="h-full rounded transition-all duration-700"
              style={{
                width: maxVal > 0 ? `${(item[valueKey] / maxVal) * 100}%` : '0%',
                background: Array.isArray(color) ? TOPIC_COLORS[i % TOPIC_COLORS.length] : color,
                minWidth: item[valueKey] > 0 ? '4px' : '0',
              }}
            />
          </div>
          <div className="text-xs text-polaris-silver/60 font-body w-6 text-right flex-shrink-0">
            {item[valueKey]}
          </div>
        </div>
      ))}
    </div>
  );
}

function HeatmapHours({ data }: { data: { hour: number; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const periods = [
    { label: 'Madrugada', hours: [0,1,2,3,4,5] },
    { label: 'Manhã', hours: [6,7,8,9,10,11] },
    { label: 'Tarde', hours: [12,13,14,15,16,17] },
    { label: 'Noite', hours: [18,19,20,21,22,23] },
  ];

  return (
    <div className="space-y-4">
      {periods.map(period => (
        <div key={period.label}>
          <div className="text-xs text-polaris-silver/40 font-display tracking-wider mb-2">{period.label}</div>
          <div className="flex gap-1.5">
            {period.hours.map(h => {
              const d = data.find(x => x.hour === h);
              const intensity = d ? d.count / max : 0;
              return (
                <div key={h} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full h-8 rounded transition-all duration-500"
                    style={{
                      background: intensity > 0
                        ? `rgba(201,168,76,${0.1 + intensity * 0.85})`
                        : 'rgba(255,255,255,0.04)',
                    }}
                    title={`${h}h — ${d?.count || 0} msgs`}
                  />
                  <span className="text-polaris-silver/30 text-xs font-body">{h}h</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniLineChart({ data }: { data: { day: string; count: number }[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const w = 100 / (data.length - 1);
  const points = data.map((d, i) => `${i * w},${100 - (d.count / max) * 90}`).join(' ');

  return (
    <div className="w-full h-20 mt-2">
      <svg viewBox={`0 0 100 100`} preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#C9A84C" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <polygon
          points={`0,100 ${points} 100,100`}
          fill="url(#lineGrad)"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#C9A84C"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-polaris-silver/30 text-xs font-body">{data[0]?.day.slice(5)}</span>
        <span className="text-polaris-silver/30 text-xs font-body">{data[data.length - 1]?.day.slice(5)}</span>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const maxTopic = data ? Math.max(...data.topTopics.map(t => t.count), 1) : 1;
  const maxSquad = data ? Math.max(...data.topSquads.map(s => s.count), 1) : 1;

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
            <span className="font-display text-xs text-polaris-silver/40 ml-3 tracking-widest">ANALYTICS</span>
          </div>
        </div>
        <Link href="/chat" className="btn-ghost px-4 py-2 rounded text-xs">← Voltar ao Chat</Link>
      </header>

      <div className="relative max-w-6xl mx-auto px-6 py-8">

        {loading && (
          <div className="text-center py-24">
            <div className="inline-flex gap-1">
              <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
            </div>
            <p className="text-polaris-silver/30 text-sm font-body mt-4">Calculando métricas...</p>
          </div>
        )}

        {!loading && data && (
          <div className="space-y-6 animate-fade-in">

            {/* Totais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total de Consultas', val: data.totals.totalMsgs, icon: '◆' },
                { label: 'Conversas', val: data.totals.totalConvs, icon: '◈' },
                { label: 'Esta semana', val: data.totals.msgsThisWeek, icon: '▲' },
                { label: 'Hoje', val: data.totals.msgsToday, icon: '★' },
              ].map(s => (
                <div key={s.label} className="gold-border rounded-xl p-5">
                  <div className="text-polaris-gold text-lg mb-1">{s.icon}</div>
                  <div className="font-display text-3xl font-black text-gold-gradient">{s.val}</div>
                  <div className="text-polaris-silver/40 text-xs font-body mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Linha do tempo */}
            <div className="gold-border rounded-xl p-6">
              <h2 className="font-display text-xs tracking-[0.15em] text-polaris-gold/80 uppercase mb-1">
                Atividade — Últimos 30 dias
              </h2>
              <p className="text-polaris-silver/30 text-xs font-body mb-3">Mensagens enviadas por dia</p>
              <MiniLineChart data={data.msgsByDay} />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Temas */}
              <div className="gold-border rounded-xl p-6">
                <h2 className="font-display text-xs tracking-[0.15em] text-polaris-gold/80 uppercase mb-1">
                  Temas Mais Consultados
                </h2>
                <p className="text-polaris-silver/30 text-xs font-body mb-4">Classificado automaticamente pela IA</p>
                {data.topTopics.length === 0 ? (
                  <p className="text-polaris-silver/30 text-sm font-body text-center py-8">
                    Os temas aparecem após as primeiras consultas
                  </p>
                ) : (
                  <BarChart data={data.topTopics} maxVal={maxTopic} color={TOPIC_COLORS} labelKey="topic" valueKey="count" />
                )}
              </div>

              {/* Squads */}
              <div className="gold-border rounded-xl p-6">
                <h2 className="font-display text-xs tracking-[0.15em] text-polaris-gold/80 uppercase mb-1">
                  Squads Mais Acionados
                </h2>
                <p className="text-polaris-silver/30 text-xs font-body mb-4">Qual frente você mais usa</p>
                {data.topSquads.length === 0 ? (
                  <p className="text-polaris-silver/30 text-sm font-body text-center py-8">
                    Os squads aparecem após as primeiras consultas
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.topSquads.map((s, i) => (
                      <div key={s.squad} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SQUAD_COLORS[s.squad] || '#94A3B8' }} />
                        <div className="flex-1 text-sm font-body text-polaris-silver/70 truncate">{s.squad}</div>
                        <div className="flex-1 h-4 bg-white/5 rounded overflow-hidden">
                          <div className="h-full rounded transition-all duration-700"
                            style={{ width: `${(s.count / maxSquad) * 100}%`, background: SQUAD_COLORS[s.squad] || '#94A3B8', minWidth: '4px' }} />
                        </div>
                        <div className="text-xs text-polaris-silver/50 font-body w-6 text-right">{s.count}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Horários de pico */}
            <div className="gold-border rounded-xl p-6">
              <h2 className="font-display text-xs tracking-[0.15em] text-polaris-gold/80 uppercase mb-1">
                Horários de Pico
              </h2>
              <p className="text-polaris-silver/30 text-xs font-body mb-5">
                Quando você mais usa o POLARIS AI — quanto mais dourado, maior o volume
              </p>
              <HeatmapHours data={data.peakHours} />
            </div>

          </div>
        )}

        {!loading && !data && (
          <div className="text-center py-24">
            <p className="text-polaris-silver/30 font-body">Erro ao carregar métricas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
