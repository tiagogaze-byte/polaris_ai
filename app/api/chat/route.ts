import { NextRequest, NextResponse } from 'next/server';
import { sql, incrementMessageCount, getMessagesByConversation } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { streamChat, generateTitle } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { message, conversationId } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 });
    }

    // Verifica limite de mensagens (admin não tem limite)
    if (currentUser.role !== 'admin') {
      const canSend = await incrementMessageCount(currentUser.sub);
      if (!canSend) {
        return NextResponse.json({
          error: 'Limite de mensagens atingido. Faça upgrade para continuar.',
          code: 'LIMIT_REACHED'
        }, { status: 429 });
      }
    }

    // Cria ou busca conversa
    let convId = conversationId;
    let isNewConversation = false;

    if (!convId) {
      const conv = await sql`
        INSERT INTO conversations (user_id, title)
        VALUES (${currentUser.sub}, 'Nova Consulta')
        RETURNING id
      `;
      convId = conv.rows[0].id;
      isNewConversation = true;
    }

    // Salva mensagem do usuário
    await sql`
      INSERT INTO messages (conversation_id, role, content)
      VALUES (${convId}, 'user', ${message.trim()})
    `;

    // Busca histórico para contexto
    const history = await getMessagesByConversation(convId);
    const chatMessages = history.map(m => ({
      role: m.role as 'user' | 'model',
      content: m.content,
    }));

    // Stream da resposta
    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          await streamChat(chatMessages, (chunk) => {
            fullResponse += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
          });

          // Salva resposta do modelo
          await sql`
            INSERT INTO messages (conversation_id, role, content)
            VALUES (${convId}, 'model', ${fullResponse})
          `;

          // Atualiza timestamp da conversa
          await sql`UPDATE conversations SET updated_at = NOW() WHERE id = ${convId}`;

          // Gera título automático para conversa nova
          if (isNewConversation) {
            const title = await generateTitle(message);
            await sql`UPDATE conversations SET title = ${title} WHERE id = ${convId}`;
          }

          // Envia metadados finais
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            done: true, 
            conversationId: convId,
            isNew: isNewConversation
          })}\n\n`));

          controller.close();
        } catch (error) {
          console.error('Erro no stream:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Erro ao gerar resposta' })}\n\n`));
          controller.close();
        }
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error) {
    console.error('Erro no chat:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
