import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { GoogleGenAI } from '@google/genai';

const TOPICS = [
  'Estratégia Eleitoral', 'Discurso e Messaging', 'Redes Sociais',
  'Gestão de Crise', 'Rebranding', 'Tráfego Pago', 'Legislação Eleitoral',
  'Diagnóstico de Cenário', 'Material de Campanha', 'Pesquisa e Dados',
];

const SQUADS = [
  'Estratégia Política', 'Publicidade e Propaganda', 'Rebranding Político', 'Geral',
];

// POST /api/analytics/classify
// Classifica uma mensagem com tema + squad (chamado internamente após chat)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { messageId, content } = await request.json();
    if (!messageId || !content) return NextResponse.json({ ok: false });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ ok: false });

    const genai = new GoogleGenAI({ apiKey });

    const prompt = `Classifique esta mensagem de consultoria política em exatamente um TEMA e um SQUAD da lista abaixo.

Mensagem: "${content.slice(0, 300)}"

TEMAS disponíveis: ${TOPICS.join(', ')}
SQUADS disponíveis: ${SQUADS.join(', ')}

Responda APENAS em JSON sem markdown:
{"topic": "...", "squad": "..."}`;

    const response = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0.1 },
    });

    const text = response.text?.trim() || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    const topic = TOPICS.includes(parsed.topic) ? parsed.topic : null;
    const squad = SQUADS.includes(parsed.squad) ? parsed.squad : null;

    if (topic || squad) {
      await sql`
        UPDATE messages
        SET topic = ${topic}, squad_detected = ${squad}
        WHERE id = ${messageId}
      `;
    }

    return NextResponse.json({ ok: true, topic, squad });
  } catch (err) {
    // Classificação é best-effort, não bloqueia o fluxo
    return NextResponse.json({ ok: false });
  }
}
