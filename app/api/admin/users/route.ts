import { NextRequest, NextResponse } from 'next/server';
import { sql, getAllUsers } from '@/lib/db';
import { getCurrentUser, hashPassword } from '@/lib/auth';

// GET /api/admin/users
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const users = await getAllUsers();
    
    // Stats gerais
    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE role = 'trial') as trials,
        COUNT(*) FILTER (WHERE role = 'client') as clients,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        SUM(messages_used) as total_messages
      FROM users
    `;

    return NextResponse.json({ users, stats: stats.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST /api/admin/users - cria usuário
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { name, email, password, role, plan, messagesLimit } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    // Manager não pode criar admin
    if (currentUser.role === 'manager' && role === 'admin') {
      return NextResponse.json({ error: 'Sem permissão para criar admin' }, { status: 403 });
    }

    const passwordHash = await hashPassword(password);
    const limit = messagesLimit || (plan === 'pro' ? 500 : plan === 'enterprise' ? 999999 : 50);

    const result = await sql`
      INSERT INTO users (name, email, password_hash, role, plan, messages_limit, created_by)
      VALUES (${name}, ${email.toLowerCase()}, ${passwordHash}, ${role || 'client'}, ${plan || 'free'}, ${limit}, ${currentUser.sub})
      RETURNING id, name, email, role, plan
    `;

    return NextResponse.json({ success: true, user: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 });
    }
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PATCH /api/admin/users - atualiza usuário
export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id, status, plan, role, messagesLimit } = await request.json();

    await sql`
      UPDATE users SET
        status = COALESCE(${status}, status),
        plan = COALESCE(${plan}, plan),
        role = COALESCE(${role}, role),
        messages_limit = COALESCE(${messagesLimit}, messages_limit),
        updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
