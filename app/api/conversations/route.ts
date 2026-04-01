import { NextRequest, NextResponse } from 'next/server';
import { getConversationsByUser, getMessagesByConversation } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { sql } from '@/lib/db';

// GET /api/conversations - lista conversas do usuário
// GET /api/conversations?id=xxx - busca mensagens de uma conversa
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');

    if (conversationId) {
      // Verifica se a conversa pertence ao usuário (ou é admin)
      const conv = await sql`
        SELECT * FROM conversations WHERE id = ${conversationId}
        AND (user_id = ${currentUser.sub} OR ${currentUser.role} = 'admin')
        LIMIT 1
      `;
      
      if (!conv.rows[0]) {
        return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
      }

      const messages = await getMessagesByConversation(conversationId);
      return NextResponse.json({ conversation: conv.rows[0], messages });
    }

    const conversations = await getConversationsByUser(currentUser.sub);
    return NextResponse.json({ conversations });

  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE /api/conversations - arquiva uma conversa
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await request.json();
    
    await sql`
      UPDATE conversations SET is_archived = TRUE
      WHERE id = ${id} AND user_id = ${currentUser.sub}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao arquivar conversa:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
