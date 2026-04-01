import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');
    if (!conversationId) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    // Busca conversa (só do próprio usuário, exceto admin)
    const conv = await sql`
      SELECT c.*, u.name as user_name
      FROM conversations c
      JOIN users u ON u.id = c.user_id
      WHERE c.id = ${conversationId}
        AND (c.user_id = ${currentUser.sub} OR ${currentUser.role} = 'admin')
      LIMIT 1
    `;

    if (!conv.rows[0]) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    const conversation = conv.rows[0];

    const msgs = await sql`
      SELECT role, content, created_at
      FROM messages
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at ASC
    `;

    const formatDate = (d: string) =>
      new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const renderMsg = (role: string, content: string, date: string) => {
      const isUser = role === 'user';
      const safeContent = content
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        // Markdown básico
        .replace(/### (.+)/g, '<h3>$1</h3>')
        .replace(/## (.+)/g, '<h2>$1</h2>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^• (.+)/gm, '<li>$1</li>')
        .replace(/^\* (.+)/gm, '<li>$1</li>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>');

      return `
        <div class="message ${isUser ? 'msg-user' : 'msg-model'}">
          <div class="msg-header">
            <span class="msg-role">${isUser ? '👤 ' + conversation.user_name : '⭐ POLARIS AI'}</span>
            <span class="msg-time">${formatDate(date)}</span>
          </div>
          <div class="msg-content"><p>${safeContent}</p></div>
        </div>`;
    };

    const messagesHtml = msgs.rows
      .map(m => renderMsg(m.role, m.content, m.created_at))
      .join('\n');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>POLARIS AI — ${conversation.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,400&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Crimson Pro', serif;
      background: #fff;
      color: #1a1a2e;
      font-size: 13pt;
      line-height: 1.6;
    }

    /* CAPA */
    .cover {
      page-break-after: always;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: linear-gradient(160deg, #0A0A0F 0%, #060B1A 60%, #0d1830 100%);
      color: white;
      text-align: center;
      padding: 60px 40px;
    }
    .cover-star {
      width: 80px; height: 80px;
      margin-bottom: 32px;
      opacity: 0.9;
    }
    .cover-brand {
      font-family: 'Cinzel', serif;
      font-size: 11pt;
      letter-spacing: 0.4em;
      color: #C9A84C;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .cover-title {
      font-family: 'Cinzel', serif;
      font-size: 22pt;
      font-weight: 700;
      color: #fff;
      margin-bottom: 12px;
      line-height: 1.3;
    }
    .cover-sub {
      font-size: 12pt;
      color: rgba(255,255,255,0.45);
      margin-bottom: 40px;
    }
    .cover-divider {
      width: 80px; height: 1px;
      background: linear-gradient(90deg, transparent, #C9A84C, transparent);
      margin: 32px auto;
    }
    .cover-meta {
      font-size: 10pt;
      color: rgba(201,168,76,0.6);
      letter-spacing: 0.1em;
    }

    /* HEADER nas páginas de conteúdo */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 0 12px;
      border-bottom: 1px solid #C9A84C30;
      margin-bottom: 24px;
    }
    .page-header-brand {
      font-family: 'Cinzel', serif;
      font-size: 8pt;
      letter-spacing: 0.25em;
      color: #C9A84C;
    }
    .page-header-title {
      font-size: 9pt;
      color: #94a3b8;
    }

    /* MENSAGENS */
    .messages { padding: 0 0 40px; }

    .message {
      margin-bottom: 20px;
      border-radius: 6px;
      overflow: hidden;
      page-break-inside: avoid;
    }

    .msg-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 14px;
      font-size: 9pt;
    }
    .msg-role { font-family: 'Cinzel', serif; font-size: 8pt; letter-spacing: 0.08em; font-weight: 600; }
    .msg-time { font-size: 8pt; color: #94a3b8; }

    .msg-content {
      padding: 12px 16px 14px;
      font-size: 11.5pt;
      line-height: 1.7;
    }
    .msg-content h2 { font-family: 'Cinzel', serif; font-size: 11pt; color: #C9A84C; margin: 12px 0 6px; }
    .msg-content h3 { font-family: 'Cinzel', serif; font-size: 10pt; color: #C9A84C99; margin: 10px 0 4px; letter-spacing: 0.05em; }
    .msg-content strong { font-weight: 600; color: #1a1a2e; }
    .msg-content li { margin-left: 16px; margin-bottom: 3px; }
    .msg-content p { margin-bottom: 8px; }
    .msg-content hr { border: none; border-top: 1px solid #e2e8f0; margin: 12px 0; }

    .msg-user .msg-header { background: #C9A84C18; color: #7c5c20; }
    .msg-user .msg-role { color: #9B7A2E; }
    .msg-user { border: 1px solid #C9A84C25; }

    .msg-model .msg-header { background: #1E3A8A12; color: #3B82F6; }
    .msg-model .msg-role { color: #1E3A8A; }
    .msg-model { border: 1px solid #1E3A8A18; background: #f8fafc; }

    /* FOOTER */
    @page {
      margin: 2cm 2.2cm 2cm 2.2cm;
      @bottom-center {
        content: "POLARIS AI  ·  Consulta Confidencial  ·  Página " counter(page);
        font-family: 'Cinzel', serif;
        font-size: 7pt;
        color: #94a3b8;
        letter-spacing: 0.1em;
      }
    }

    @media print {
      .cover { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .msg-user .msg-header, .msg-model .msg-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>

<!-- CAPA -->
<div class="cover">
  <svg class="cover-star" viewBox="0 0 80 80" fill="none">
    <polygon points="40,5 50,30 75,30 55,46 63,70 40,54 17,70 25,46 5,30 30,30"
      fill="none" stroke="#C9A84C" stroke-width="2"/>
    <circle cx="40" cy="40" r="7" fill="#C9A84C"/>
  </svg>
  <div class="cover-brand">POLARIS AI</div>
  <div class="cover-sub">Super Agente de Consultoria e Marketing Político</div>
  <div class="cover-divider"></div>
  <div class="cover-title">${conversation.title}</div>
  <div class="cover-meta">${formatDate(conversation.created_at)}</div>
  <div class="cover-meta" style="margin-top:8px">Consulta de ${conversation.user_name}</div>
</div>

<!-- CONTEÚDO -->
<div class="page-header">
  <span class="page-header-brand">POLARIS AI</span>
  <span class="page-header-title">${conversation.title}</span>
</div>

<div class="messages">
  ${messagesHtml}
</div>

<script>window.onload = () => window.print();</script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Erro no export PDF:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
