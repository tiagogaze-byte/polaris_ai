import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = currentUser.sub;

    // 1. Mensagens por dia — últimos 30 dias
    const msgsByDay = await sql`
      SELECT
        DATE_TRUNC('day', m.created_at)::date AS day,
        COUNT(*) FILTER (WHERE m.role = 'user') AS count
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE c.user_id = ${userId}
        AND m.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    // 2. Temas mais consultados (top 8)
    const topTopics = await sql`
      SELECT
        COALESCE(m.topic, 'Não classificado') AS topic,
        COUNT(*) AS count
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE c.user_id = ${userId}
        AND m.role = 'user'
      GROUP BY 1
      ORDER BY 2 DESC
      LIMIT 8
    `;

    // 3. Horários de pico — distribuição por hora do dia
    const peakHours = await sql`
      SELECT
        EXTRACT(HOUR FROM m.created_at)::int AS hour,
        COUNT(*) AS count
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE c.user_id = ${userId}
        AND m.role = 'user'
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    // 4. Squads mais acionados
    const topSquads = await sql`
      SELECT
        COALESCE(m.squad_detected, 'Geral') AS squad,
        COUNT(*) AS count
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE c.user_id = ${userId}
        AND m.role = 'user'
        AND m.squad_detected IS NOT NULL
      GROUP BY 1
      ORDER BY 2 DESC
    `;

    // 5. Totais gerais
    const totals = await sql`
      SELECT
        COUNT(*) FILTER (WHERE m.role = 'user') AS total_msgs,
        COUNT(DISTINCT c.id) AS total_convs,
        COUNT(*) FILTER (
          WHERE m.role = 'user'
          AND m.created_at >= NOW() - INTERVAL '7 days'
        ) AS msgs_this_week,
        COUNT(*) FILTER (
          WHERE m.role = 'user'
          AND m.created_at >= DATE_TRUNC('day', NOW())
        ) AS msgs_today
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE c.user_id = ${userId}
    `;

    // Preenche dias sem mensagens com 0 (últimos 30 dias)
    const last30Days: { day: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const found = msgsByDay.rows.find(r => String(r.day).startsWith(key));
      last30Days.push({ day: key, count: found ? Number(found.count) : 0 });
    }

    // Preenche todas as 24h
    const allHours = Array.from({ length: 24 }, (_, h) => {
      const found = peakHours.rows.find(r => Number(r.hour) === h);
      return { hour: h, count: found ? Number(found.count) : 0 };
    });

    return NextResponse.json({
      totals: {
        totalMsgs: Number(totals.rows[0]?.total_msgs || 0),
        totalConvs: Number(totals.rows[0]?.total_convs || 0),
        msgsThisWeek: Number(totals.rows[0]?.msgs_this_week || 0),
        msgsToday: Number(totals.rows[0]?.msgs_today || 0),
      },
      msgsByDay: last30Days,
      topTopics: topTopics.rows.map(r => ({ topic: r.topic, count: Number(r.count) })),
      peakHours: allHours,
      topSquads: topSquads.rows.map(r => ({ squad: r.squad, count: Number(r.count) })),
    });

  } catch (error) {
    console.error('Erro no analytics:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
