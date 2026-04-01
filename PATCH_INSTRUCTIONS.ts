// ============================================================
// PATCH: app/chat/page.tsx
// Adicionar 3 coisas pequenas ao arquivo existente
// ============================================================

// ─── 1. BOTÃO "EXPORTAR PDF" no header da conversa ───────────
// Encontre o bloco do <header> dentro do main e adicione o botão:
// (após o <div className="flex-1"> com o título da conversa)

{currentConvId && (
  <a
    href={`/api/export/pdf?id=${currentConvId}`}
    target="_blank"
    rel="noopener noreferrer"
    className="btn-ghost px-3 py-1.5 rounded text-xs flex items-center gap-1.5 flex-shrink-0"
    title="Exportar conversa como PDF"
  >
    <span>↓</span> PDF
  </a>
)}


// ─── 2. LINK "Analytics" no sidebar (footer do sidebar) ──────
// Adicione antes do link "Painel Admin" (ou após, se não for admin):

<a href="/analytics" className="block text-center text-xs text-polaris-silver/40 hover:text-polaris-gold mb-2 font-display tracking-wider transition-colors">
  ◆ Meu Analytics
</a>


// ─── 3. CLASSIFICAÇÃO após salvar resposta ───────────────────
// No arquivo app/api/chat/route.ts, após salvar a mensagem do usuário:
// (logo depois do INSERT INTO messages ... role='user')

// Salva ID da mensagem do usuário para classificar depois
const userMsgResult = await sql`
  INSERT INTO messages (conversation_id, role, content)
  VALUES (${convId}, 'user', ${message.trim()})
  RETURNING id
`;
const userMessageId = userMsgResult.rows[0].id;

// Após fechar o stream, dispara classificação async (fire-and-forget):
// (não bloqueia a resposta)
fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/analytics/classify`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') || '' },
  body: JSON.stringify({ messageId: userMessageId, content: message.trim() }),
}).catch(() => {});

// ============================================================
// RESUMO DAS MUDANÇAS:
//
// chat/page.tsx:
//   + Botão "↓ PDF" no header (visível só quando tem conversa aberta)
//   + Link "◆ Meu Analytics" no sidebar
//
// api/chat/route.ts:
//   + Captura o ID da mensagem salva
//   + Dispara classificação assíncrona (não impacta latência)
//
// NOVOS ARQUIVOS (apenas copiar para o projeto):
//   app/analytics/page.tsx
//   app/api/analytics/route.ts
//   app/api/analytics/classify/route.ts
//   app/api/export/pdf/route.ts
//   migration_v2_analytics.sql
// ============================================================
